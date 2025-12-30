// src/routes/game.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server } from 'socket.io';
import { db } from '../database/memoryDB';
import { GameInviteSchema, GameInviteInput, GameResponseSchema, GameResponseInput } from '../schemas/game.schemas';
import { rankedMatchmakingRouteSchema, inviteFriendRouteSchema, respondInviteRouteSchema } from '../schemas/swagger/game.route.schemas';

interface RankedQueueItem {
    userId: number;
    score: number;
    timestamp: number;
}

// Fila em memória
let rankedQueue: RankedQueueItem[] = [];
const pendingInvites = new Map<string, number>();

// HELPER: Busca socket pelo ID do usuário armazenado em socket.data.id
function findSocketByUserId(io: Server, userId: number) {
    for (const [_, socket] of io.sockets.sockets) {
        // Usa '==' para garantir compatibilidade entre string e number
        if (socket.data?.id == userId) {
            return socket;
        }
    }
    return undefined;
}

export async function gameRoutes(app: FastifyInstance, options: { io: Server }) {
    const io = options.io;

    const verifyUser = async (req: FastifyRequest, reply: FastifyReply) => {
        const user = await db.findUserById(req.user.id);
        if (!user) return reply.code(404).send({ error: 'Usuário não autenticado' });
        return user;
    };

    // --- ROTA DE MATCHMAKING (RANKED) ---
    app.get('/ranked', {
        onRequest: [app.authenticate],
        schema: rankedMatchmakingRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const currentUser = (await verifyUser(req, reply))!;
        
        // 1. Remove usuário atual da fila (limpeza preventiva)
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
                // SUCESSO!
                rankedQueue.splice(opponentIndex, 1);

                const roomId = `ranked_${Math.min(currentUser.id, opponentItem.userId)}_${Math.max(currentUser.id, opponentItem.userId)}_${Date.now()}`;

                // Avisa o oponente via Socket
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
                // Limpeza de socket fantasma
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

    // --- ROTA: CONVIDAR AMIGO (CASUAL) ---
    app.post('/casual/invite', {
        onRequest: [app.authenticate],
        // Se tiver schema de validação, adicione aqui (ex: schema: inviteFriendRouteSchema)
    }, async (req: FastifyRequest, reply) => {
        const sender = (await verifyUser(req, reply))!;
        
        // Tipagem simples do corpo da requisição
        const { nick } = req.body as { nick: string };

        if (!nick) {
            return reply.code(400).send({ error: 'Nick do amigo é obrigatório.' });
        }

        // 1. Buscar usuário alvo
        const target = db.findUserByNick(nick);

        if (!target) {
            return reply.code(404).send({ error: 'Usuário não encontrado.' });
        }

        if (target.id === sender.id) {
            return reply.code(400).send({ error: 'Você não pode convidar a si mesmo.' });
        }

        // 2. Salvar convite na memória
        // Chave = REMETENTE_ID:DESTINATARIO_ID
        const inviteKey = `${sender.id}:${target.id}`;
        pendingInvites.set(inviteKey, Date.now());

        // 3. Notificar o alvo em Tempo Real (Socket.IO)
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

    // --- ROTA: RESPONDER CONVITE (CASUAL) ---
    app.post('/casual/response', {
        onRequest: [app.authenticate],
        schema: respondInviteRouteSchema,
        preHandler: [app.validateBody(GameResponseSchema)]
    }, async (req: FastifyRequest, reply) => {
        const { nick, action } = req.body as GameResponseInput;
        const currentUser = (await verifyUser(req, reply))!; // Quem aceitou/recusou

        const sender = db.findUserByNick(nick); // Quem convidou
        if (!sender) return reply.code(404).send({ error: 'Remetente não encontrado' });

        // A chave é: REMETENTE:DESTINATARIO (sender:currentUser)
        const inviteKey = `${sender.id}:${currentUser.id}`;
        
        // Verifica se existe convite pendente (opcional, mas recomendado)
        // if (!pendingInvites.has(inviteKey)) return reply.code(400)...

        pendingInvites.delete(inviteKey);

        const senderSocket = findSocketByUserId(io, sender.id);

        if (action === 'decline') {
            if (senderSocket) {
                // CORREÇÃO: Payload compatível com frontend
                senderSocket.emit('inviteDeclined', { 
                    nick: currentUser.nick // O frontend espera 'nick' para mostrar quem recusou
                });
            }
            return reply.send({ status: 'declined', message: 'Convite recusado.' });
        }

        if (action === 'accept') {
            const roomId = `casual_${sender.id}_${currentUser.id}_${Date.now()}`;

            if (senderSocket) {
                // Avisa quem convidou que o jogo vai começar
                senderSocket.emit('inviteAccepted', { 
                    roomId, 
                    opponentId: currentUser.id
                });
            }

            // Retorna roomId para quem aceitou (via resposta HTTP)
            return reply.send({
                status: 'accepted',
                roomId: roomId,
                opponentId: sender.id
            });
        }
    });

    // Sair da fila
    app.post('/queue/leave', { onRequest: [app.authenticate] }, async (req, reply) => {
        const userId = req.user.id;
        rankedQueue = rankedQueue.filter(u => u.userId !== userId);
        return reply.send({ message: 'Saiu da fila.' });
    });
}