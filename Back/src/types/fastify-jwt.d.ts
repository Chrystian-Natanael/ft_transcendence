import '@fastify/jwt'
import 'fastify'

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: { id: number; email: string; nick: string; isAnonymous: boolean }
		user: { id: number; email: string; nick: string; isAnonymous: boolean }
	}
}

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: any
	}
}
