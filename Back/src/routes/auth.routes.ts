import { FastifyInstance, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

import { db } from '../database/memoryDB';
import { AuthService } from '../services/authServices';

import {
    RegisterInput, registerSchema,
    LoginInput, loginSchema,
    Login2FAInput, login2FASchema,
    AnonymousInput, anonymousSchema,
    Enable2FAInput, enable2FASchema,
    Disable2FAInput, disable2FASchema
} from '../schemas/auth.schemas';

import {
    registerRouteSchema, loginRouteSchema, login2FARouteSchema,
    anonymousRouteSchema, meRouteSchema, logoutRouteSchema
} from '../schemas/swagger/route.schemas';

import {
    setup2FARouteSchema, enable2FARouteSchema, disable2FARouteSchema
} from '../schemas/swagger/2fa.schemas';

const CLEANUP_INTERVAL = 1 * 60 * 1000;

export async function authRoutes(app: FastifyInstance) {
    const cleanupTimer = setInterval(AuthService.cleanupInactiveAnonymous, CLEANUP_INTERVAL);

    app.addHook('onClose', () => {
        clearInterval(cleanupTimer);
    });

    app.decorate('updateLastActivity', (req: FastifyRequest) => {
        if (req.user) {
            AuthService.updateActivity(req.user.id);
        }
    });

    // --- REGISTER ---
    app.post('/register', {
        schema: registerRouteSchema,
        preHandler: app.validateBody(registerSchema)
    }, async (req, reply) => {
        const { name, nick, email, password, gang } = req.body as RegisterInput;

        if (db.findUserByNick(nick)) return reply.code(400).send({ error: 'Nick já em uso' });
        if (db.findUserByEmail(email)) return reply.code(400).send({ error: 'Email já cadastrado' });

        const passwordHash = await bcrypt.hash(password!, 10);
        
        const user = db.addUser({
            name, nick, email, password: passwordHash,
            isAnonymous: false, gang,
            friends: [], friendRequestsSent: [], friendRequestsReceived: []
        });

        return AuthService.sanitizeUser(user);
    });

    // --- LOGIN ---
    app.post('/login', {
        schema: loginRouteSchema,
        preHandler: app.validateBody(loginSchema)
    }, async (req, reply) => {
        const { identifier, password } = req.body as LoginInput;

        const user = db.findByIdentifier(identifier);
        if (!user || !user.password) return reply.code(404).send({ error: 'Credenciais inválidas' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return reply.code(401).send({ error: 'Credenciais inválidas' });

        // Fluxo 2FA
        if (user.twoFactorEnabled) {
            const tempToken = app.jwt.sign({
                id: user.id, email: user.email, nick: user.nick,
                isAnonymous: user.isAnonymous, gang: user.gang, temp2FA: true
            }, { expiresIn: '5m' });

            return reply.code(200).send({
                requires2FA: true,
                tempToken,
                message: 'Por favor, insira o código 2FA'
            });
        }

        const token = app.jwt.sign({
            id: user.id, email: user.email, nick: user.nick,
            isAnonymous: user.isAnonymous, gang: user.gang
        });

        return reply.code(200).send({ token, user: AuthService.sanitizeUser(user) });
    });

    // --- LOGIN 2FA ---
    app.post('/login/2fa', {
        onRequest: [app.authenticate2FA],
        schema: login2FARouteSchema,
        preHandler: app.validateBody(login2FASchema)
    }, async (req: FastifyRequest, reply) => {
        const { token } = req.body as Login2FAInput;

        const user = await db.findUserById(req.user.id);

        if (!user) return reply.code(401).send({ error: 'Usuário não encontrado' });
        if (!user.twoFactorEnabled || !user.twoFactorSecret) return reply.code(400).send({ error: '2FA não habilitado' });

        let isValid = authenticator.check(token, user.twoFactorSecret);
        
        if (!isValid && user.backupCodes?.includes(token)) {
            user.backupCodes = user.backupCodes.filter(code => code !== token);
            isValid = true;
        }

        if (!isValid) return reply.code(400).send({ error: 'Token inválido' });

        const finalToken = app.jwt.sign({
            id: user.id, email: user.email, nick: user.nick,
            isAnonymous: user.isAnonymous, gang: user.gang
        });

        return { token: finalToken, user: AuthService.sanitizeUser(user) };
    });

    // --- ANONYMOUS ---
    app.post('/anonymous', {
        schema: anonymousRouteSchema,
        preHandler: app.validateBody(anonymousSchema)
    }, async (req, reply) => {
        const { nick } = req.body as AnonymousInput;
        const generatedNick = `anonymous_${nick}`;

        if (db.findUserByNick(generatedNick)) return reply.code(400).send({ error: 'Nick já em uso' });

        const user = db.addUser({
            name: generatedNick, nick: generatedNick,
            email: `anonymous_${Date.now()}@local`,
            isAnonymous: true,
            gang: Math.random() > 0.5 ? 'potatoes' : 'tomatoes',
            friends: [], friendRequestsSent: [], friendRequestsReceived: []
        });

        const token = app.jwt.sign({
            id: user.id, email: user.email, nick: user.nick,
            isAnonymous: true, gang: user.gang,
        }, { expiresIn: '2h' });

        return { token, user: AuthService.sanitizeUser(user) };
    });

    // --- ME ---
    app.get('/me', {
        onRequest: [app.authenticate],
        onResponse: [app.updateLastActivity],
        schema: meRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const user = await db.findUserById(req.user.id);
        if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
        return { user: AuthService.sanitizeUser(user) };
    });

    // --- LOGOUT (DELETE ANONYMOUS) ---
    app.post('/logout', {
        onRequest: [app.authenticate],
        schema: logoutRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const user = await db.findUserById(req.user.id);
        
        if (user && user.isAnonymous) {
            db.deleteUser(user.id);
        }

        return reply.code(200).send({ message: 'Logout realizado' });
    });

    // =========================================================================
    // ROTAS DE CONFIGURAÇÃO DE 2FA (SETUP, ENABLE, DISABLE)
    // =========================================================================

    app.post('/2fa/setup', {
        onRequest: [app.authenticate],
        schema: setup2FARouteSchema
    }, async (req: FastifyRequest, reply) => {
        const user = await db.findUserById(req.user.id);
        if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
        if (user.twoFactorEnabled) return reply.code(400).send({ error: '2FA já habilitado' });

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, 'ft_transcendence', secret);
        const qrcode = await QRCode.toDataURL(otpauth);

        user.twoFactorSecret = secret;

        return { secret, qrcode };
    });

    app.post('/2fa/enable', {
        onRequest: [app.authenticate],
        schema: enable2FARouteSchema,
        preHandler: app.validateBody(enable2FASchema)
    }, async (req: FastifyRequest, reply) => {
        const { token, secret } = req.body as Enable2FAInput;
        const user = await db.findUserById(req.user.id);

        if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
        if (user.twoFactorEnabled) return reply.code(400).send({ error: '2FA já habilitado' });
        if (user.twoFactorSecret !== secret) return reply.code(400).send({ error: 'Segredo inválido' });

        const isValid = authenticator.check(token, secret);
        if (!isValid) return reply.code(400).send({ error: 'Token inválido' });

        user.twoFactorEnabled = true;
        user.backupCodes = AuthService.generateBackupCodes();

        return { message: '2FA habilitado com sucesso', backupCodes: user.backupCodes };
    });

    app.post('/2fa/disable', {
        onRequest: app.authenticate,
        schema: disable2FARouteSchema,
        preHandler: app.validateBody(disable2FASchema)
    }, async (req: FastifyRequest, reply) => {
        const { token } = req.body as Disable2FAInput;
        const user = await db.findUserById(req.user.id);

        if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
        if (!user.twoFactorEnabled || !user.twoFactorSecret) return reply.code(400).send({ error: '2FA não está habilitado' });

        let isValid = authenticator.check(token, user.twoFactorSecret);
        if (!isValid && user.backupCodes?.includes(token)) {
             user.backupCodes = user.backupCodes.filter(c => c !== token);
             isValid = true;
        }

        if (!isValid) return reply.code(400).send({ error: 'Token inválido' });

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.backupCodes = undefined;

        return { message: '2FA desabilitado com sucesso' };
    });
}