import { FastifyInstance } from "fastify";
import bcrypt from 'bcrypt'

interface User {
	id: number;
	name: string;
	nick: string;
	email: string;
	password?: string;
	isAnonymous: boolean
}

const registerSchema = {
	body: {
		type: 'object',
		required: ['name', 'nick', 'email', 'password'],
		additionalProperties: false,
		properties: {
			name: { type: 'string', minLength: 1 },
			nick: { type: 'string', minLength: 2 },
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 4 }
		}
	}
}

const loginSchema = {
	body: {
		type: 'object',
		required: ['identifier', 'password'],
		additionalProperties: false,
		properties: {
			identifier: { type: 'string', minLength: 2 },
			password: { type: 'string', minLength: 4 }
		}
	}
}

// Schema anônimo
const anonymousSchema = {
	body: {
		type: 'object',
		additionalProperties: false,
		properties: {
			name: { type: 'string', minLength: 1 },
			nick: { type: 'string', minLength: 2 }
		}
	}
}

// const ANONYMOUS_INACTIVITY_TIMEOUT	= 5 * 60 * 1000;	// 5 minutos de inatividade
// const CLEANUP_INTERVAL				= 1 * 60 * 1000;	// A cada 1 minuto

const	users: User[] = []
let		nextId = 1

function sanitize(user: User) {
	return {
		id: user.id,
		name: user.name,
		nick: user.nick,
		email: user.isAnonymous ? undefined : user.email,
		isAnonymous: user.isAnonymous
	}
}

function findByIdentifier(identifier: string): User | undefined {
	return (users.find(u =>
		(u.email === identifier || u.nick === identifier) && !u.isAnonymous
	))
}

export async function authRoutes(app: FastifyInstance) {
	app.post('/auth/register', { schema: registerSchema }, async (req, reply) => {
		const { name, nick, email, password } = req.body as User

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
			isAnonymous: false
		}
		users.push(user)

		return (sanitize(user))
	})

	app.post('/auth/login', { schema: loginSchema }, async (req, reply) => {
		const { identifier, password } = req.body as { identifier: string; password: string }

		const user = findByIdentifier(identifier)
		if (!user || !user.password) {
			return reply.code(401).send({ error: 'Credenciais inválidas' })
		}

		const password_pass = await bcrypt.compare(password, user.password)
		if (!password_pass) {
			return reply.code(401).send({ error: 'Credenciais inválidas' })
		}

		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			nick: user.nick,
			isAnonymous: user.isAnonymous
		})

		return { token, user: sanitize(user) }
	})

	app.post('/auth/anonymous', { schema: anonymousSchema }, async (req, reply) => {
		const { nick } = req.body as { nick: string }

		const generatedNick = `anonymous_${nick}`
		if (users.find(u => u.nick === generatedNick && u.isAnonymous)) {
			return reply.code(400).send({ error: 'Nick já está em uso' })
		}

		const user: User = {
			id: nextId++,
			name: generatedNick,
			nick: generatedNick,
			email: `anonymous_${nextId}@local`,
			isAnonymous: true
		}
		users.push(user)

		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			nick: user.nick,
			isAnonymous: true
		}, { expiresIn: '2h'})

		return ( {token, user: sanitize(user)} )
	})

	app.get('/auth/me', {
		onRequest: [app.authenticate]
	}, async (req: any, reply) => {
		const user = users.find(u => u.id === req.user.id)
		if (!user) {
			return (reply.code(404).send({ error: 'Usuário não encontrado' }))
		}
		return ({ user: sanitize(user) })
	})
}
