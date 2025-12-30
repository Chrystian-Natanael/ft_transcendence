import bcrypt from 'bcrypt'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { PlayerController } from '../database/controllers/player.controller'
import {
	AnonymousInput, anonymousSchema,
	DeleteAccountInput,
	deleteAccountSchema,
	Disable2FAInput, disable2FASchema,
	Enable2FAInput, enable2FASchema,
	Login2FAInput, login2FASchema,
	LoginInput, loginSchema,
	RegisterInput, registerSchema
} from '../schemas/auth.schemas'
import {
	disable2FARouteSchema,
	enable2FARouteSchema,
	setup2FARouteSchema
} from '../schemas/swagger/2fa.schemas'
import {
	anonymousRouteSchema,
	deleteAccountRouteSchema,
	login2FARouteSchema,
	loginRouteSchema,
	logoutRouteSchema,
	registerRouteSchema
} from '../schemas/swagger/route.schemas'
import { AuthService } from '../services/authServices'

const CLEANUP_INTERVAL = 1 * 60 * 1000

export async function authRoutes(app: FastifyInstance) {
	const cleanupTimer = setInterval(AuthService.cleanupInactiveAnonymous, CLEANUP_INTERVAL)

	app.addHook('onClose', () => {
		clearInterval(cleanupTimer)
	})

	app.decorate('updateLastActivity', (req: FastifyRequest) => {
		if (req.user) {
			AuthService.updateActivity(req.user.id)
		}
	})

	app.post('/register', {
		schema: registerRouteSchema,
		preHandler: app.validateBody(registerSchema)
	}, async (req, reply) => {
		const { name, nick, email, password, gang } = req.body as RegisterInput

		const existingNick = await PlayerController.findByNick(nick)
		if (existingNick) return reply.code(400).send({ error: 'Nick já em uso' })

		const existingEmail = await PlayerController.findByEmail(email)
		if (existingEmail) return reply.code(400).send({ error: 'Email já cadastrado' })

		const passwordHash = await bcrypt.hash(password!, 10)

		const user = await PlayerController.create({
			name,
			nick,
			email,
			password: passwordHash,
			isAnonymous: false,
			gang,
		})

		return AuthService.sanitizePlayer(user)
	})

	app.post('/login', {
		schema: loginRouteSchema,
		preHandler: app.validateBody(loginSchema)
	}, async (req, reply) => {
		const { identifier, password } = req.body as LoginInput

		const user = await PlayerController.findByIdentifier(identifier)

		if (!user || !user.password) return reply.code(404).send({ error: 'Credenciais inválidas' })

		const isValid = await bcrypt.compare(password, user.password!)
		if (!isValid) return reply.code(401).send({ error: 'Credenciais inválidas' })

		if (user.twoFAEnabled) {
			const tempToken = app.jwt.sign({
				id: user.id, email: user.email, nick: user.nick,
				isAnonymous: user.isAnonymous, gang: user.gang, temp2FA: true
			}, { expiresIn: '5m' })

			return reply.code(200).send({
				requires2FA: true,
				tempToken,
				message: 'Por favor, insira o código 2FA'
			})
		}

		const token = app.jwt.sign({
			id: user.id, email: user.email, nick: user.nick,
			isAnonymous: user.isAnonymous, gang: user.gang
		})

		let finalUser = AuthService.sanitizePlayer(user);
		return reply.code(200).send({ token, user: finalUser })
	})

	app.post('/login/2fa', {
		onRequest: [app.authenticate2FA],
		schema: login2FARouteSchema,
		preHandler: app.validateBody(login2FASchema)
	}, async (req: FastifyRequest, reply) => {
		const { token } = req.body as Login2FAInput

		const user = await PlayerController.findById(req.user.id)
		if (!user) return reply.code(401).send({ error: 'Usuário não encontrado' })

		if (!user.twoFAEnabled || !user.twoFASecret) return reply.code(400).send({ error: '2FA não habilitado' })

		let isValid = authenticator.check(token, user.twoFASecret)

		if (!isValid) {
			const backupCode = await PlayerController.getBackupCodes(user.id)
			if (backupCode && backupCode.includes(token)) {
				await PlayerController.removeBackupCode(user.id, token)
				isValid = true
			}
		}

		if (!isValid) return reply.code(400).send({ error: 'Token inválido' })

		const finalToken = app.jwt.sign({
			id: user.id, email: user.email, nick: user.nick,
			isAnonymous: user.isAnonymous, gang: user.gang
		})

		return { token: finalToken, user: AuthService.sanitizePlayer(user) }
	})

	app.post('/anonymous', {
		schema: anonymousRouteSchema,
		preHandler: app.validateBody(anonymousSchema)
	}, async (req, reply) => {
		const { nick } = req.body as AnonymousInput
		const generatedNick = `anonymous_${nick}`

		const existing = await PlayerController.findByNick(generatedNick)
		if (existing) return reply.code(400).send({ error: 'Nick já em uso' })

		const user = await PlayerController.create({
			name: generatedNick,
			nick: generatedNick,
			email: `anonymous_${Date.now()}@local`,
			password: '',
			isAnonymous: true,
			gang: Math.random() > 0.5 ? 'potatoes' : 'tomatoes',
		})

		const token = app.jwt.sign({
			id: user.id, email: user.email, nick: user.nick,
			isAnonymous: true, gang: user.gang,
		}, { expiresIn: '2h' })

		return { token, user: AuthService.sanitizePlayer(user) }
	})

	app.post('/logout', {
		onRequest: [app.authenticate],
		schema: logoutRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const user = await PlayerController.findById(req.user.id)

		if (user && user.isAnonymous) {
			await PlayerController.delete(user.id)
		}

		return reply.code(200).send({ message: 'Logout realizado' })
	})

	app.delete('/delete', {
		onRequest: [app.authenticate],
		schema: deleteAccountRouteSchema,
		preHandler: app.validateBody(deleteAccountSchema)
	}, async (req: FastifyRequest, reply) => {
		const { password, token } = req.body as DeleteAccountInput

		const user = await PlayerController.findById(req.user.id)

		if (!user) {
			return reply.code(400).send({ error: 'Usuário não encontrado' })
		}

		if (!user.isAnonymous) {
			if (!password) {
				return reply.code(400).send({ error: 'A senha é obrigatória para confirmar a exclusão.' })
			}

			const isPassValid = await bcrypt.compare(password, user.password!)
			if (!isPassValid) {
				return reply.code(400).send({ error: 'Senha incorreta.' })
			}

			if (user.twoFAEnabled) {
				if (!token) {
					return reply.code(400).send({ error: 'Token 2FA é obrigatório.' })
				}

				let isValid = authenticator.check(token, user.twoFASecret!)

				if (!isValid) {
					const backupCode = await PlayerController.getBackupCodes(user.id)
					if (backupCode && backupCode.includes(token)) {
						await PlayerController.removeBackupCode(user.id, token)
						isValid = true
					}
				}

				if (!isValid) {
					return reply.code(400).send({ error: 'Token 2FA inválido.' })
				}
			}
		}

		await PlayerController.delete(user.id)
		return reply.code(200).send({ message: 'Conta deletada com sucesso.' })
	})

	app.post('/2fa/setup', {
		onRequest: [app.authenticate],
		schema: setup2FARouteSchema
	}, async (req: FastifyRequest, reply) => {
		const user = await PlayerController.findById(req.user.id)

		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })
		if (user.twoFAEnabled) return reply.code(400).send({ error: '2FA já habilitado' })

		const secret = authenticator.generateSecret()
		const otpauth = authenticator.keyuri(user.email, 'ft_transcendence', secret)
		const qrcode = await QRCode.toDataURL(otpauth)

		await PlayerController.update(user.id, { twoFASecret: secret })

		return { secret, qrcode }
	})

	app.post('/2fa/enable', {
		onRequest: [app.authenticate],
		schema: enable2FARouteSchema,
		preHandler: app.validateBody(enable2FASchema)
	}, async (req: FastifyRequest, reply) => {
		const { token, secret } = req.body as Enable2FAInput
		const user = await PlayerController.findById(req.user.id)

		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })
		if (user.twoFAEnabled) return reply.code(400).send({ error: '2FA já habilitado' })
		if (user.twoFASecret !== secret) return reply.code(400).send({ error: 'Segredo inválido' })
		const isValid = authenticator.check(token, secret)
		if (!isValid) return reply.code(400).send({ error: 'Token inválido' })

		const backupCodes = AuthService.generateBackupCodes()
		await PlayerController.update(user.id, { twoFAEnabled: true })
		await PlayerController.addBackupCodes(user.id, backupCodes)

		return { message: '2FA habilitado com sucesso', backupCodes }
	})

	app.post('/2fa/disable', {
		onRequest: app.authenticate,
		schema: disable2FARouteSchema,
		preHandler: app.validateBody(disable2FASchema)
	}, async (req: FastifyRequest, reply) => {
		const { token } = req.body as Disable2FAInput
		const user = await PlayerController.findById(req.user.id)
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })

		if (!user.twoFAEnabled || !user.twoFASecret) return reply.code(400).send({ error: '2FA não está habilitado' })

		let isValid = authenticator.check(token, user.twoFASecret)
		const backupCode = await PlayerController.getBackupCodes(user.id)

		if (!isValid) {
			if (backupCode && backupCode.includes(token)) {
				await PlayerController.removeBackupCode(user.id, token)
				isValid = true
			}
		}

		if (!isValid) return reply.code(400).send({ error: 'Token inválido' })

		await PlayerController.update(user.id, { twoFAEnabled: false, twoFASecret: null })

		for (const code of backupCode) {
			await PlayerController.removeBackupCode(user.id, code)
		}

		return { message: '2FA desabilitado com sucesso' }
	})
}
