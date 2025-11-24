import fastify from 'fastify'
import dotenv from 'dotenv'
import jwt from '@fastify/jwt'

import { pingRoutes } from './routes/ping.routes'
import { authRoutes } from './routes/auth.routes'

dotenv.config()

const app = fastify()

app.register(jwt, {
	secret: process.env.JWT_SECRET || 'JWT_SECRET'
})

app.decorate('authenticate', async function (req: any, reply: any) {
	try {
		await req.jwtVerify()
	} catch (err) {
		return (reply.code(401).send({ error: 'Token Inválido' }))
	}
})

// Rotas
app.register(pingRoutes)
app.register(authRoutes)

// Rodar
app.listen({ port: 3333 }).then(() => {
	console.log('🚀 Servidor rodando em http://localhost:3333')
})
