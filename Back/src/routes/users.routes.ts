import { FastifyInstance } from 'fastify'

import { db } from '../database/memoryDB'
import { nickSchema, UpdateNickInput } from '../schemas/common.schemas'
import { updateNickRouteSchema } from '../schemas/swagger/users.schemas'
import { AuthService } from '../services/authServices'

export async function usersRoutes(app: FastifyInstance) {
	app.patch('/me', {
		onRequest: [app.authenticate],
		schema: updateNickRouteSchema,
		preHandler: app.validateBody(nickSchema)
	}, async (req, reply) => {
		const { nick } = req.body as UpdateNickInput

		const user = await db.findUserById(req.user.id)
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const existingUser = db.findUserByNick(nick)
		if (existingUser) {
			return reply.code(400).send({ error: 'Nick já em uso' })
		}

		user.nick = nick

		const token = app.jwt.sign({
			id: user.id, email: user.email, nick: user.nick,
			isAnonymous: user.isAnonymous, gang: user.gang
		})

		return reply.code(200).send({
			message: 'Nick atualizado com sucesso',
			user: AuthService.sanitizeUser(user),
			token: token
		})
	})

	app.patch('/me/avatar', {
		onRequest: [app.authenticate],
		// schema: updateAvatarRouteSchema,
		// preHandler: app.validateBody(avatarSchema)
	}, async (req, reply) => {
		const { avatarId } = req.body as { avatarId: string };
		
		const user = await db.findUserById(req.user.id);
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
		
		// Validar se o ID é válido (de uma lista conhecida)
		// const validAvatarIds = ['potato-1', 'potato-2', 'potato-3', 'potato-4', 'potato-5', 'potato-6', 'potato-7', 'tomato-1', 'tomato-2', 'tomato-3', 'tomato-4', 'tomato-5', 'tomato-6'];
		// if (!validAvatarIds.includes(avatarId)) {
		// 	return reply.code(400).send({ error: 'Avatar ID inválido' });
		// }
		
		user.setAvatar(avatarId);

		console.log(`User ${user.nick} updated avatar to ${avatarId}`);
		
		return reply.code(200).send({
			message: 'Avatar atualizado com sucesso',
			user: AuthService.sanitizeUser(user)
		});
	});

	app.get('/me', {
		onRequest: [app.authenticate],
	}, async (req, reply) => {
		const user = await db.findUserById(req.user.id);
		if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });

		return reply.send({
			user: AuthService.sanitizeUser(user),
			profile: {
				avatar: user.avatar || null,
				gameAvatar: user.gameAvatar || null,
				score: user.score || 0,
				wins: user.wins || 0,
				losses: user.losses || 0,
			}
		});
	});
}
