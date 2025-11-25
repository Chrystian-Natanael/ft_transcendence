import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import fastify, { FastifyReply, FastifyRequest } from 'fastify'

import zodValidator from './plugins/zod-validator'
import { authRoutes } from './routes/auth.routes'

dotenv.config()

const app = fastify()

app.register(cors, {
	origin: '*'
})

app.register(jwt, {
	secret: process.env.JWT_SECRET || 'JWT_SECRET'
})

app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
	try {
		await req.jwtVerify()
	} catch {
		return (reply.code(401).send({ error: 'Token Inválido' }))
	}
})

// Rotas
app.register(zodValidator)
app.register(authRoutes, { prefix: '/auth'})

// Rodar
app.listen({ port: 3333 }).then(() => {
	console.log('🚀 Servidor rodando em http://localhost:3333')
})
