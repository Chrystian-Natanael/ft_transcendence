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
import { FriendRequestInput, FriendRequestSchema, FriendResponseInput, FriendResponseSchema, UserIDSchema, UserIDSchemaInput } from '../schemas/friends.schemas'
import {
	disable2FARouteSchema,
	enable2FARouteSchema,
	login2FARouteSchema,
	setup2FARouteSchema
} from '../schemas/swagger/2fa.schemas'
import { friendsListRouteSchema, getUserByIdRouteSchema, removeFriendRouteSchema, respondFriendRequestRouteSchema, sendFriendRequestRouteSchema } from '../schemas/swagger/friends.route.schemas'
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
	gang: 'potatoes' | 'tomatoes'
	twoFactorEnabled?: boolean;
	twoFactorSecret?: string;
	backupCodes?: string[];
	score?: number;

	friends: number[];
	friendRequestsSent: number[];
	friendRequestsReceived: number[];
}

const ANONYMOUS_INACTIVITY_TIMEOUT	= 5 * 60 * 1000	// 5 minutos de inatividade
const CLEANUP_INTERVAL				= 1 * 60 * 1000	// A cada 1 minuto


// DADOS MOCKADOS PARA TESTE - APAGAR DEPOIS
const	users: User[] = [
	{
		id: 1,
		name: 'batata',
		nick: 'batata',
		email: 'batata@teste.com',
		password: '$2b$10$zyn5MC8ezQtsVR/4NQD6W.fdIfSDC.997KP72mNbq2EjBt.hEnWKe',
		isAnonymous: false,
		gang: 'potatoes',
		friends: [],
		friendRequestsSent: [],
		friendRequestsReceived: [],
		score: 5000,
		lastActivity: Date.now()
	},
	{
		id: 2,
		name: 'tomate',
		nick: 'tomate',
		email: 'tomate@teste.com',
		password: '$2b$10$zyn5MC8ezQtsVR/4NQD6W.fdIfSDC.997KP72mNbq2EjBt.hEnWKe',
		isAnonymous: false,
		gang: 'tomatoes',
		friends: [],
		friendRequestsSent: [],
		friendRequestsReceived: [],
		score: 4500,
		lastActivity: Date.now()
	},
	{
		id: 3,
		name: 'Dev Teste',
		nick: 'dev',
		email: 'dev@teste.com',
		password: '$2b$10$zyn5MC8ezQtsVR/4NQD6W.fdIfSDC.997KP72mNbq2EjBt.hEnWKe',
		isAnonymous: false,
		gang: 'potatoes',
		friends: [],
		friendRequestsSent: [],
		friendRequestsReceived: [],
		score: 100,
		lastActivity: Date.now()
	}
]
let		nextId = 4

function sanitize(user: User) {
	return {
		id: user.id,
		name: user.name,
		nick: user.nick,
		email: user.isAnonymous ? undefined : user.email,
		isAnonymous: user.isAnonymous,
		gang: user.gang,
		// friends: user.friends
	}
}

function sanitizeFriends(user: User) {
	return {
		id: user.id,
		nick: user.nick,
		gang: user.gang,
		isOnline: true,
	}
}

function sanitizeRequestsFriends(user: User) {
	return {
		id: user.id,
		nick: user.nick,
		avatar: 'src/assets/perfil-sla.png'
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
			gang: gang,
			friends: [],
			friendRequestsSent: [],
			friendRequestsReceived: []
		}
		users.push(user)

		console.log(`${passwordHash}`)

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
			gang: Math.random() > 0.5 ? 'potatoes' : 'tomatoes',
			friends: [],
			friendRequestsSent: [],
			friendRequestsReceived: []
		}
		users.push(user)

		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			nick: user.nick,
			isAnonymous: true,
			gang: user.gang,
		}, { expiresIn: '2h'})

		console.log(`Anonimo ${nick} entrou`)

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

		let isValid = authenticator.check(token, user.twoFactorSecret)
		if (!isValid && user.backupCodes?.includes(token)) {
			user.backupCodes = user.backupCodes.filter(code => code !== token)
			isValid = true
		}
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

export async function friendsRoutes(app: FastifyInstance) {
	const verifyUser = async (req: FastifyRequest, reply: FastifyReply) => {
		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return reply.code(404).send({ error: 'Usuário não autenticado' })
		}
	}

	app.get('/list', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser],
		schema: friendsListRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const currentUser = users.find(u => u.id === req.user.id)!

		const myFriends = users
			.filter(u => currentUser.friends.includes(u.id))
			.map(u => sanitizeFriends(u))

		return reply.send(myFriends)
	})

	app.get('/users/:id', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateParams(UserIDSchema)],
		schema: getUserByIdRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { id } = req.params as UserIDSchemaInput

		const user = users.find(u => u.id === id)
		if (!user) {
			return reply.code(404).send({ error: 'Usuário não encontrado' })
		}

		return reply.send(sanitize(user))
	})

	app.post('/request', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateBody(FriendRequestSchema)],
		schema: sendFriendRequestRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { nick } = req.body as FriendRequestInput
		const sender = users.find(u => u.id === req.user.id)!
		const target = users.find(u => u.nick === nick)

		if (!target) {
			return reply.code(404).send({ error: 'Usuário alvo não encontrado' })
		}

		if (target.id === sender.id) {
			return reply.code(400).send({ error: 'Você não pode adicionar a si mesmo' })
		}

		if (sender.friends.includes(target.id)) {
			return reply.code(400).send({ error: 'Vocês já são amigos' })
		}

		if (sender.friendRequestsSent.includes(target.id)) {
			return reply.code(400).send({ error: 'Solicitação já enviada' })
		}

		if (sender.friendRequestsReceived.includes(target.id)) {
			return reply.code(400).send({ error: 'Este usuário já te enviou uma solicitação. Aceite-a.' })
		}

		sender.friendRequestsSent.push(target.id)
		target.friendRequestsReceived.push(sender.id)

		return reply.send({ message: `Solicitação enviada para ${target.nick}` })
	})

	app.post('/response', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateBody(FriendResponseSchema)],
		schema: respondFriendRequestRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { nick, action } = req.body as FriendResponseInput
		const currentUser = users.find(u => u.id === req.user.id)!
		const requester = users.find(u => u.nick === nick)

		if (!requester) {
			return reply.code(404).send({ error: 'Usuário não encontrado' })
		}

		if (!currentUser.friendRequestsReceived.includes(requester.id)) {
			return reply.code(400).send({ error: 'Não  há solicitação pendente deste usuário' })
		}

		currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(id => id !== requester.id)
		requester.friendRequestsSent = requester.friendRequestsSent.filter(id => id !== currentUser.id)

		if (action === 'accept') {
			currentUser.friends.push(requester.id)
			requester.friends.push(currentUser.id)
			return reply.send({ message: `Agora você e ${requester.nick} são amigos!` })
		} else {
			return reply.send({ message: 'Solicitação recusada' })
		}
	})

	app.delete('/remove/:id', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateParams(UserIDSchema)],
		schema: removeFriendRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { id } = req.params as UserIDSchemaInput

		const currentUser = users.find(u => u.id === req.user.id)!
		const targetUser = users.find(u => u.id === id)

		if (!targetUser) {
			return reply.code(404).send({ error: 'Usuário não encontrado' })
		}

		if (!currentUser.friends.includes(id)) {
			return reply.code(400).send({ error: 'Vocês não são amigos' })
		}

		currentUser.friends = currentUser.friends.filter(friendId => friendId !== id)
		targetUser.friends = targetUser.friends.filter(friendId => friendId !== currentUser.id)

		console.log(`${currentUser.nick} removeu ${targetUser.nick} dos amigos.`)
		return reply.send({ message: 'Amizade desfeita com sucesso' })
	})

	app.get('/requests/received', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser],
	}, async (req: FastifyRequest, reply) => {
		const currentUser = users.find(u => u.id === req.user.id)!

		const incomingRequests = users
			.filter(u => currentUser.friendRequestsReceived.includes(u.id))
			.map(u => sanitizeRequestsFriends(u))

		return reply.send(incomingRequests)
	})
}

export async function leaderboardRoutes(app: FastifyInstance) {

	app.get('/', {
		onRequest: [app.authenticate]
	}, async (req, reply) => {

		const leaderboardData = users.map(u => ({
			id: u.id,
			name: u.name,
			nick: u.nick,
			avatar: 'src/assets/perfil-sla.png',
			score: u.score || Math.floor(Math.random() * 10000), // Fiz um score aleatorio pra testar
			gang: u.gang,
			isOnline: true,
			rank: 0
		}))

		// Ordenando score
		leaderboardData.sort((a, b) => b.score - a.score)

		leaderboardData.forEach((user, index) => {
			user.rank = index + 1
		})

		return reply.send(leaderboardData)
	})
}
