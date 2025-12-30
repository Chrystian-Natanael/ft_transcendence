import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Server } from 'socket.io';
import { PlayerController } from '../database/controllers/player.controller';
import { GameResponseInput, GameResponseSchema } from '../schemas/game.schemas';
import { rankedMatchmakingRouteSchema, respondInviteRouteSchema } from '../schemas/swagger/game.route.schemas';

interface RankedQueueItem {
	userId: number;
	score: number;
	timestamp: number;
}

let rankedQueue: RankedQueueItem[] = [];
const pendingInvites = new Map<string, number>();

function findSocketByUserId(io: Server, userId: number) {
	for (const [_, socket] of io.sockets.sockets) {
		if (socket.data?.id == userId) {
			return socket;
		}
	}
	return undefined;
}

export async function gameRoutes(app: FastifyInstance, options: { io: Server }) {
	const io = options.io;

	const verifyUser = async (req: FastifyRequest, reply: FastifyReply) => {
		const user = await PlayerController.findById(req.user.id)
		if (!user) return reply.code(404).send({ error: 'Usuário não autenticado' });
		return user;
	};

	app.get('/ranked', {
		onRequest: [app.authenticate],
		schema: rankedMatchmakingRouteSchema
	}, async (req: FastifyRequest, reply) => {
		const currentUser = (await verifyUser(req, reply))!;

		rankedQueue = rankedQueue.filter(item => item.userId !== currentUser.id);

		const SCORE_RANGE = 10000;

		let opponentIndex = -1;

		while (true) {
			opponentIndex = rankedQueue.findIndex(opponent =>
				Math.abs(opponent.score - (currentUser.score || 0)) <= SCORE_RANGE
			);

			if (opponentIndex === -1) break;

			const opponentItem = rankedQueue[opponentIndex];
			const opponentSocket = findSocketByUserId(io, opponentItem.userId);

			if (opponentSocket) {
				rankedQueue.splice(opponentIndex, 1);

				const roomId = `ranked_${Math.min(currentUser.id, opponentItem.userId)}_${Math.max(currentUser.id, opponentItem.userId)}_${Date.now()}`;
				opponentSocket.emit('matchFound', {
					roomId,
					opponentId: currentUser.id,
					message: "Oponente encontrado!"
				});

				console.log(`[MATCH] ${currentUser.nick} vs ${opponentItem.userId}`);

				return reply.send({
					status: 'match_found',
					roomId: roomId,
					opponentId: opponentItem.userId,
					message: 'Oponente encontrado! Conectando...'
				});
			} else {
				rankedQueue.splice(opponentIndex, 1);
			}
		}

		rankedQueue.push({
			userId: currentUser.id,
			score: currentUser.score || 0,
			timestamp: Date.now()
		});

		return reply.send({
			status: 'queued',
			message: 'Você entrou na fila. Aguardando oponente...'
		});
	});

	app.post('/casual/invite', {
		onRequest: [app.authenticate],
	}, async (req: FastifyRequest, reply) => {
		const sender = (await verifyUser(req, reply))!;
		const { nick } = req.body as { nick: string };

		if (!nick) {
			return reply.code(400).send({ error: 'Nick do amigo é obrigatório.' });
		}

		const target = await PlayerController.findByNick(nick);

		if (!target) {
			return reply.code(404).send({ error: 'Usuário não encontrado.' });
		}

		if (target.id === sender.id) {
			return reply.code(400).send({ error: 'Você não pode convidar a si mesmo.' });
		}

		const inviteKey = `${sender.id}:${target.id}`;
		pendingInvites.set(inviteKey, Date.now());
		const targetSocket = findSocketByUserId(io, target.id);

		if (targetSocket) {
			console.log(`[INVITE] Enviando evento socket para ${target.nick}`);
			targetSocket.emit('inviteReceived', {
				senderNick: sender.nick,
				senderAvatar: sender.avatar || `https://ui-avatars.com/api/?name=${sender.nick}&background=random`
			});
		}

		return reply.send({ message: `Convite enviado para ${target.nick}!` });
	});

	app.post('/casual/response', {
		onRequest: [app.authenticate],
		schema: respondInviteRouteSchema,
		preHandler: [app.validateBody(GameResponseSchema)]
	}, async (req: FastifyRequest, reply) => {
		const { nick, action } = req.body as GameResponseInput;
		const currentUser = (await verifyUser(req, reply))!;

		const sender = await PlayerController.findByNick(nick);
		if (!sender) return reply.code(404).send({ error: 'Remetente não encontrado' });

		const inviteKey = `${sender.id}:${currentUser.id}`;
		pendingInvites.delete(inviteKey);

		const senderSocket = findSocketByUserId(io, sender.id);

		if (action === 'decline') {
			if (senderSocket) {
				senderSocket.emit('inviteDeclined', {
					nick: currentUser.nick
				});
			}
			return reply.send({ status: 'declined', message: 'Convite recusado.' });
		}

		if (action === 'accept') {
			const roomId = `casual_${sender.id}_${currentUser.id}_${Date.now()}`;

			if (senderSocket) {
				senderSocket.emit('inviteAccepted', {
					roomId,
					opponentId: currentUser.id
				});
			}

			return reply.send({
				status: 'accepted',
				roomId: roomId,
				opponentId: sender.id
			});
		}
	});

	app.post('/queue/leave', { onRequest: [app.authenticate] }, async (req, reply) => {
		const userId = req.user.id;
		rankedQueue = rankedQueue.filter(u => u.userId !== userId);
		return reply.send({ message: 'Saiu da fila.' });
	});
}
