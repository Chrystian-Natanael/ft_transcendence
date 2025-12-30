import { FastifyInstance, FastifyRequest } from 'fastify'

import { PlayerController } from '../database/controllers/player.controller'
import { User } from '../database/memoryDB'
import { nickSchema, UpdateNickInput } from '../schemas/common.schemas'
import { updateNickRouteSchema } from '../schemas/swagger/users.schemas'
import { AuthService } from '../services/authServices'

export async function usersRoutes(app: FastifyInstance) {
	app.patch('/me', {
		onRequest: [app.authenticate],
		schema: updateNickRouteSchema,
		preHandler: app.validateBody(nickSchema)
	}, async (req: FastifyRequest, reply) => {
		const { nick } = req.body as UpdateNickInput

		const user = await PlayerController.findById(req.user.id)
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const existingUser = await PlayerController.findByNick(nick)
		if (existingUser && existingUser.id !== user.id) {
			return reply.code(400).send({ error: 'Nick já em uso' })
		}

		const updatedUser = await PlayerController.update(user.id, { nick })
		const updatedUser2 = {
			id: updatedUser.id,
			email: updatedUser.email,
			nick: updatedUser.nick,
			isAnonymous: updatedUser.isAnonymous,
			gang: updatedUser.gang
		} as User

		const token = app.jwt.sign({
			id: updatedUser2.id,
			email: updatedUser2.email,
			nick: updatedUser2.nick,
			isAnonymous: updatedUser2.isAnonymous,
			gang: updatedUser2.gang
		})

		return reply.code(200).send({
			message: 'Nick atualizado com sucesso',
			user: AuthService.sanitizeUser(updatedUser2),
			token: token
		})
	})

	app.patch('/me/avatar', {
		onRequest: [app.authenticate],
		// schema: updateAvatarRouteSchema,
		// preHandler: app.validateBody(avatarSchema)
	}, async (req: FastifyRequest, reply) => {
		const { avatarId } = req.body as { avatarId: string }

		const user = await PlayerController.findById(req.user.id)
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const updatedUser = await PlayerController.update(user.id, { avatar: avatarId })
		const updatedUser2 = {
			id: updatedUser.id,
			email: updatedUser.email,
			nick: updatedUser.nick,
			isAnonymous: updatedUser.isAnonymous,
			gang: updatedUser.gang
		} as User

		return reply.code(200).send({
			message: 'Avatar atualizado com sucesso',
			user: AuthService.sanitizeUser(updatedUser2)
		})
	})

	app.get('/me', {
		onRequest: [app.authenticate],
	}, async (req: FastifyRequest, reply) => {
		const player = await PlayerController.findById(req.user.id)
		if (!player) return reply.code(404).send({ error: 'Usuário não encontrado' })
		const user = {
			id: player.id,
			email: player.email,
			nick: player.nick,
			isAnonymous: player.isAnonymous,
			gang: player.gang,
			avatar: player.avatar,
			score: player.score,
		} as User

		return reply.send({
			user: AuthService.sanitizeUser(user),
			profile: {
				avatar: user.avatar || null,
				score: user.score || 0,
			}
		})
	})
}
