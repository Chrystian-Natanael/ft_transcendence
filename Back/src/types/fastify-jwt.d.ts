import '@fastify/jwt'
import 'fastify'
import { FastifyRequest, FastifyReply } from 'fastify'

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: {
			id: number;
			email: string;
			nick: string;
			isAnonymous: boolean;
			gang: string
		}
		user: {
			id: number;
			email: string;
			nick: string;
			isAnonymous: boolean;
			gang: string
		}
	}
}

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
	}
}
