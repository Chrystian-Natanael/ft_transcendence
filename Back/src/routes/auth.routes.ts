import crypto from 'crypto'

import bcrypt from 'bcrypt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import {
	AnonymousInput,
	anonymousSchema,
	Disable2FAInput,
	disable2FASchema,
	Enable2FAInput,
	enable2FASchema,
	Login2FAInput,
	login2FASchema,
	LoginInput,
	loginSchema,
	RegisterInput,
	registerSchema
} from '../schemas/auth.schemas'
import {
	disable2FARouteSchema,
	enable2FARouteSchema,
	login2FARouteSchema,
	setup2FARouteSchema
} from '../schemas/swagger/2fa.schemas'
import {
	anonymousRouteSchema,
	loginRouteSchema,
	logoutRouteSchema,
	meRouteSchema,
	registerRouteSchema
} from '../schemas/swagger/route.schemas'

interface User {
	id: number;
	name: string;
	nick: string;
	email: string;
	password?: string;
	isAnonymous: boolean;
	lastActivity?: number;
	gang: 'batatas' | 'tomates'
	twoFactorEnabled?: boolean;
	twoFactorSecret?: string;
	backupCodes?: string[];
}

const ANONYMOUS_INACTIVITY_TIMEOUT	= 5 * 60 * 1000	// 5 minutos de inatividade
const CLEANUP_INTERVAL				= 1 * 60 * 1000	// A cada 1 minuto

const	users: User[] = []
let		nextId = 1

function sanitize(user: User) {
	return {
		id: user.id,
		name: user.name,
		nick: user.nick,
		email: user.isAnonymous ? undefined : user.email,
		isAnonymous: user.isAnonymous,
		gang: user.gang
	}
}

function findByIdentifier(identifier: string): User | undefined {
	return (users.find(u =>
		(u.email === identifier || u.nick === identifier) && !u.isAnonymous
	))
}

function updateActivity(userId: number) {
	const user = users.find(u => u.id == userId)
	if (user && user.isAnonymous) {
		user.lastActivity = Date.now()
	}
}

function cleanupInactiveAnonymous() {
	const now = Date.now()
	const before = users.length

	const activeUsers = users.filter(user => {
		if (!user.isAnonymous)
			return (true)
		if (!user.lastActivity)
			return (false)

		const inactiveTime = now - user.lastActivity
		return (inactiveTime < ANONYMOUS_INACTIVITY_TIMEOUT)
	})

	const removed = before - activeUsers.length
	if (removed > 0) {
		users.length = 0
		users.push(...activeUsers)
	}
}

function generateBackupCodes(count: number = 8): string[] {
	const codes: string[] = []
	for (let i = 0; i < count; i++) {
		const code = crypto.randomBytes(4).toString('hex').toUpperCase()
		codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
	}
	return codes
}

export async function authRoutes(app: FastifyInstance) {

	const cleanupTimer = setInterval(cleanupInactiveAnonymous, CLEANUP_INTERVAL)

	app.addHook('onClose', () => {
		clearInterval(cleanupTimer)
	})

	app.decorate('updateLastActivity', (req: FastifyRequest) => {
		if (req.user) {
			updateActivity(req.user.id)
		}
	})

	app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
		try {
			await req.jwtVerify()
			// Bloquear tokens temporários 2FA
			if (req.user.temp2FA) {
				return reply.code(401).send({ error: 'Token temporário não é válido para esta ação' })
			}
		} catch {
			return reply.code(401).send({ error: 'Token Inválido' })
		}
	})

	app.decorate('authenticate2FA', async function (req: FastifyRequest, reply: FastifyReply) {
		try {
			await req.jwtVerify()
			if (!req.user.temp2FA) {
				return reply.code(401).send({ error: 'Token temporário inválido' })
			}
		} catch {
			return reply.code(401).send({ error: 'Token Inválido' })
		}
	})

	app.post('/register', {
		schema: registerRouteSchema,
		preHandler: app.validateBody(registerSchema)
	}, async (req, reply) => {
		const { name, nick, email, password, gang } = req.body as RegisterInput

		if (users.find(u => u.nick === nick)) {
			return (reply.code(400).send({ error: 'Nick já em uso' }))
		}
		if (users.find(u => u.email === email)) {
			return (reply.code(400).send({ error: 'Email já cadastrado' }))
		}

		const passwordHash: string = await bcrypt.hash(password!, 10)
		const user: User = {
			id: nextId++,
			name: name,
			nick: nick,
			email: email,
			password: passwordHash,
			isAnonymous: false,
			gang: gang
		}
		users.push(user)

		console.log(`${name} se cadastrou`)

		return (sanitize(user))
	})

	app.post('/login', {
		schema: loginRouteSchema,
		preHandler: app.validateBody(loginSchema)
	}, async (req, reply) => {
		const { identifier, password } = req.body as LoginInput

		const user = findByIdentifier(identifier)
		if (!user || !user.password) {
			return reply.code(404).send({ error: 'Credenciais inválidas' })
		}

		const password_pass = await bcrypt.compare(password, user.password)
		if (!password_pass) {
			return reply.code(401).send({ error: 'Credenciais inválidas' })
		}

		if (user.twoFactorEnabled) {
			const tempToken = app.jwt.sign({
				id: user.id,
				email: user.email,
				nick: user.nick,
				isAnonymous: user.isAnonymous,
				gang: user.gang,
				temp2FA: true
			}, { expiresIn: '5m' })

			const response = {
				requires2FA: true,
				tempToken: tempToken,
				message: 'Por favor, insira o código 2FA'
			}

			return reply.code(200).send(response)
		}

		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			nick: user.nick,
			isAnonymous: user.isAnonymous,
			gang: user.gang
		})

		return reply.code(200).send({ token, user: sanitize(user) })
	})

	app.post('/login/2fa', {
		onRequest: [app.authenticate2FA],
		schema: login2FARouteSchema,
		preHandler: app.validateBody(login2FASchema)
	}, async (req: FastifyRequest, reply) => {
		const { token } = req.body as Login2FAInput

		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return reply.code(404).send({ error: 'Usuário não encontrado' })
		}

		if (!user.twoFactorEnabled || !user.twoFactorSecret) {
			return reply.code(400).send({ error: '2FA não está habilitado' })
		}

		let isValid = authenticator.check(token, user.twoFactorSecret)
		if (!isValid && user.backupCodes?.includes(token)) {
			user.backupCodes = user.backupCodes.filter(code => code !== token)
			isValid = true
		}
		if (!isValid) {
			return reply.code(400).send({ error: 'Token inválido' })
		}

		const finalToken = app.jwt.sign({
			id: user.id,
			email: user.email,
			nick: user.nick,
			isAnonymous: user.isAnonymous,
			gang: user.gang
		})

		return { token: finalToken, user: sanitize(user) }
	})

	app.post('/anonymous', {
		schema: anonymousRouteSchema,
		preHandler: app.validateBody(anonymousSchema)
	}, async (req, reply) => {
		const { nick } = req.body as AnonymousInput

		const generatedNick = `anonymous_${nick}`
		if (users.find(u => u.nick === generatedNick && u.isAnonymous)) {
			return reply.code(400).send({ error: 'Nick já está em uso' })
		}

		const user: User = {
			id: nextId++,
			name: generatedNick,
			nick: generatedNick,
			email: `anonymous_${nextId}@local`,
			isAnonymous: true,
			lastActivity: Date.now(),
			gang: 'batatas'
		}
		users.push(user)

		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			nick: user.nick,
			isAnonymous: true,
			gang: 'batatas'
		}, { expiresIn: '2h'})

		console.log(`Anonimo ${nick} entrou`);

		return ( {token, user: sanitize(user)} )
	})

	app.get('/me', {
		onRequest: [app.authenticate],
		onResponse: [app.updateLastActivity],
		schema: meRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return (reply.code(404).send({ error: 'Usuário não encontrado' }))
		}

		// updateActivity(user.id)

		return ({ user: sanitize(user) })
	})

	app.post('/2fa/setup', {
		onRequest: [app.authenticate],
		schema: setup2FARouteSchema
	}, async (req: FastifyRequest, reply) => {
		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return (reply.code(404).send({ error: 'Usuário não encontrado' }))
		}

		if (user.twoFactorEnabled) {
			return (reply.code(400).send({ error: '2FA já está habilitado' }))
		}

		const secret = authenticator.generateSecret()
		const otpauth = authenticator.keyuri(user.email, 'ft_transcendence', secret)
		const qrcode = await QRCode.toDataURL(otpauth)

		user.twoFactorSecret = secret

		return ({
			secret,
			qrcode
		})
	})

	app.post('/2fa/enable', {
		onRequest: [app.authenticate],
		schema: enable2FARouteSchema,
		preHandler: app.validateBody(enable2FASchema)
	}, async (req: FastifyRequest, reply) => {
		const { token, secret } = req.body as Enable2FAInput

		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return (reply.code(404).send({ error: 'Usuário não encontrado' }))
		}

		if (user.twoFactorEnabled) {
			return (reply.code(400).send({ error: '2FA já está habilitado' }))
		}

		if (user.twoFactorSecret !== secret) {
			return (reply.code(400).send({ error: 'Segredo inválido' }))
		}

		const isValid = authenticator.check(token, secret)
		if (!isValid) {
			return (reply.code(400).send({ error: 'Token inválido' }))
		}

		user.twoFactorEnabled = true
		user.backupCodes = generateBackupCodes()

		return ({
			message: '2FA habilitado com sucesso',
			backupCodes: user.backupCodes
		})
	})

	app.post('/2fa/disable', {
		onRequest: app.authenticate,
		schema: disable2FARouteSchema,
		preHandler: app.validateBody(disable2FASchema)
	}, async (req: FastifyRequest, reply) => {
		const { token } = req.body as Disable2FAInput

		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return (reply.code(404).send({ error: 'Usuário não encontrado' }))
		}

		if (!user.twoFactorEnabled || !user.twoFactorSecret) {
			return (reply.code(400).send({ error: '2FA não está habilitado' }))
		}

		const isValid = authenticator.verify({
			token,
			secret: user.twoFactorSecret
		})
		if (!isValid) {
			return (reply.code(400).send({ error: 'Token inválido' }))
		}

		user.twoFactorEnabled = false
		user.twoFactorSecret = undefined
		user.backupCodes = undefined

		return ({ message: '2FA desabilitado com sucesso' })
	})

	app.post('/logout', {
		onRequest: [app.authenticate],
		schema: logoutRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const userId = req.user.id
		const userIndex = users.findIndex(u => u.id === userId)

		if (userIndex === -1) {
			return (reply.code(404).send({ error: 'Usuário não encontrado' }))
		}

		users.splice(userIndex, 1)

		return (reply.code(200).send())
	})
}
