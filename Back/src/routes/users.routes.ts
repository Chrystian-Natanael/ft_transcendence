import { FastifyInstance, FastifyRequest } from 'fastify'

import { PlayerController } from '../database/controllers/player.controller'
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
		const userGang = updatedUser.gang as 'potatoes' | 'tomatoes';

		const token = app.jwt.sign({
			id: updatedUser.id,
			email: updatedUser.email,
			nick: updatedUser.nick,
			isAnonymous: updatedUser.isAnonymous,
			gang: userGang
		})

		return reply.code(200).send({
			message: 'Nick atualizado com sucesso',
			user: AuthService.sanitizePlayer(updatedUser),
			token: token
		})
	})

	app.patch('/me/avatar', {
		onRequest: [app.authenticate],
	}, async (req: FastifyRequest, reply) => {
		const { avatarId } = req.body as { avatarId: string }

		const user = await PlayerController.findById(req.user.id)
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const updatedUser = await PlayerController.update(user.id, { avatar: avatarId })

		return reply.code(200).send({
			message: 'Avatar atualizado com sucesso',
			user: AuthService.sanitizePlayer(updatedUser)
		})
	})

	app.get('/me', {
		onRequest: [app.authenticate],
	}, async (req: FastifyRequest, reply) => {
		const player = await PlayerController.findById(req.user.id)

		if (!player) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const winRate = await PlayerController.getWinRate(player.id);

		return reply.send({
			id: player.id,
			name: player.name,
			nick: player.nick,
			email: player.email,
			isAnonymous: player.isAnonymous,
			gang: player.gang,
			has2FA: player.twoFAEnabled,
			avatar: player.avatar || null,
			score: player.score || 0,
			gamesWinned: player.gamesWinned || 0,
			gamesLosed: player.gamesLosed || 0,
			gamesPlayed: player.gamesPlayed || 0,
			winRate: winRate
		})
	})
}
