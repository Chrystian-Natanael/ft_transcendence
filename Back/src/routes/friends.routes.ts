import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FriendsController } from '../database/controllers/friends.controller'
import { PlayerController } from '../database/controllers/player.controller'
import {
	FriendRequestInput, FriendRequestSchema,
	FriendResponseInput, FriendResponseSchema,
	UserIDSchema, UserIDSchemaInput
} from '../schemas/friends.schemas'
import {
	friendsListRouteSchema, getUserByIdRouteSchema,
	removeFriendRouteSchema,
	respondFriendRequestRouteSchema,
	sendFriendRequestRouteSchema
} from '../schemas/swagger/friends.route.schemas'
import { AuthService } from '../services/authServices'

function sanitizeFriends(user: any) {
	return {
		id: user.id,
		nick: user.nick,
		gang: user.gang,
		isOnline: user.isOnline ?? false,
		avatar: user.avatar || '/assets/Profile_images/Potato_default.jpg'
	}
}

function sanitizeRequestsFriends(user: any) {
	return {
		id: user.id,
		nick: user.nick,
		avatar: user.avatar || '/assets/Profile_images/Potato_default.jpg'
	}
}

export async function friendsRoutes(app: FastifyInstance) {

	const verifyUser = async (req: FastifyRequest, reply: FastifyReply) => {
		const user = await PlayerController.findById(req.user.id)
		if (!user) {
			return reply.code(404).send({ error: 'Usuário não autenticado' })
		}
	}

	app.get('/list', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser],
		schema: friendsListRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const friends = await FriendsController.getFriends(req.user.id)
		const sanitizedFriends = friends.map(f => sanitizeFriends(f))

		return reply.send(sanitizedFriends)
	})

	app.get('/users/:id', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateParams(UserIDSchema)],
		schema: getUserByIdRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { id } = req.params as UserIDSchemaInput

		const player = await PlayerController.findById(Number(id))
		if (!player) {
			return reply.code(404).send({ error: 'Usuário não encontrado' })
		}

		return reply.send(AuthService.sanitizePlayer(player))
	})

	app.post('/request', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateBody(FriendRequestSchema)],
		schema: sendFriendRequestRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { nick } = req.body as FriendRequestInput
		const senderId = req.user.id

		const sender = await PlayerController.findById(senderId)
		if (!sender) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const target = await PlayerController.findByNick(nick)
		if (!target) return reply.code(404).send({ error: 'Usuário alvo não encontrado' })
		if (target.id === senderId) return reply.code(400).send({ error: 'Você não pode adicionar a si mesmo' })

		const alreadyFriends = await FriendsController.areFriends(senderId, target.id)
		if (alreadyFriends) return reply.code(400).send({ error: 'Vocês já são amigos' })

		const inviteAlreadySent = await FriendsController.inviteExists(senderId, target.id)
		if (inviteAlreadySent) return reply.code(400).send({ error: 'Solicitação já enviada' })

		const reverseInvite = await FriendsController.inviteExists(target.id, senderId)
		if (reverseInvite) {
			return reply.code(400).send({
				error: 'Este usuário já te enviou uma solicitação. Aceite-a.'
			})
		}

		await FriendsController.sendInvite(senderId, target.id)

		return reply.send({ message: `Solicitação enviada para ${target.nick}` })
	})

	app.post('/response', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateBody(FriendResponseSchema)],
		schema: respondFriendRequestRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { nick, action } = req.body as FriendResponseInput
		const currentUserId = req.user.id

		const requester = await PlayerController.findByNick(nick)
		if (!requester) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const inviteExists = await FriendsController.inviteExists(requester.id, currentUserId)
		if (!inviteExists) {
			return reply.code(400).send({ error: 'Não há solicitação pendente deste usuário' })
		}

		if (action === 'accept') {
			await FriendsController.acceptInvite(requester.id, currentUserId)
			return reply.send({ message: `Agora você e ${requester.nick} são amigos!` })
		} else {
			await FriendsController.declineInvites(requester.id, currentUserId)
			return reply.send({ message: 'Solicitação recusada' })
		}
	})

	app.delete('/remove/:id', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser, app.validateParams(UserIDSchema)],
		schema: removeFriendRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const { id } = req.params as UserIDSchemaInput
		const friendId = Number(id)
		const currentUserId = req.user.id

		const targetUser = await PlayerController.findById(friendId)
		if (!targetUser) return reply.code(404).send({ error: 'Usuário não encontrado' })

		const areFriends = await FriendsController.areFriends(currentUserId, friendId)
		if (!areFriends) return reply.code(400).send({ error: 'Vocês não são amigos' })

		await FriendsController.removeFriend(currentUserId, friendId)

		const currentUser = await PlayerController.findById(currentUserId)
		console.log(`${currentUser?.nick} removeu ${targetUser.nick} dos amigos.`)

		return reply.send({ message: 'Amizade desfeita com sucesso' })
	})

	app.get('/requests/received', {
		onRequest: [app.authenticate],
		preHandler: [verifyUser],
	}, async (req: FastifyRequest, reply) => {
		const incomingRequests = await FriendsController.getReceivedInvites(req.user.id)
		const sanitized = incomingRequests.map(u => sanitizeRequestsFriends(u))

		return reply.send(sanitized)
	})
}
