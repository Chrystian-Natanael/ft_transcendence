import { FastifyInstance } from 'fastify'

export async function pingRoutes(app: FastifyInstance) {
	app.get('/ping', async () => ({ ok: true }))
}
