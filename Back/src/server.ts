import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { Server, Socket } from 'socket.io'

import { PongMatch } from './game/PongMatch'
import swaggerPlugin from './plugins/swagger'
import zodValidator from './plugins/zod-validator'
import { authRoutes } from './routes/auth.routes'
import { friendsRoutes } from './routes/friends.routes'
import { gameRoutes } from './routes/game.routes'
import { leaderboardRoutes } from './routes/leaderboard.routes'
import { usersRoutes } from './routes/users.routes'

import { PlayerController } from './database/controllers/player.controller'

dotenv.config()

declare module 'fastify' {
    interface FastifyJWT {
        payload: {
            id: number
            email: string
            nick: string
            isAnonymous: boolean
            gang: string
            temp2FA?: boolean
        }
        user: {
            id: number
            email: string
            nick: string
            isAnonymous: boolean
            gang: string
            temp2FA?: boolean
        }
    }
}

const app = fastify({ logger: false })

let waitingPlayer: Socket | null = null

const activeMatches: Map<string, PongMatch> = new Map()

app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})

app.register(jwt, { secret: process.env.JWT_SECRET || 'JWT_SECRET' })
app.register(swaggerPlugin)


app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
        await req.jwtVerify()
        if (req.user.temp2FA) {
            return reply.code(401).send({ error: 'Token temporário. Complete o 2FA.' })
        }
    } catch (err) {
        return reply.code(401).send({ error: 'Token Inválido ou Expirado' })
    }
})

app.decorate('authenticate2FA', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
        await req.jwtVerify()
        if (!req.user.temp2FA) {
            return reply.code(401).send({ error: 'Token inválido para etapa 2FA' })
        }
    } catch (err) {
        return reply.code(401).send({ error: 'Token Inválido' })
    }
})

app.register(zodValidator)

app.register(authRoutes, { prefix: '/auth' })
app.register(friendsRoutes, { prefix: '/friends' })
app.register(leaderboardRoutes, { prefix: '/leaderboards' })
app.register(usersRoutes, { prefix: '/users' })

const start = async () => {
    try {

        const io = new Server(app.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        })
        app.register(gameRoutes, { prefix: '/game', io: io })
        await app.ready()

        io.use(async (socket, next) => {
            const token = socket.handshake.auth.token;

            if (!token) return next(new Error("Authentication error: No token"));

            try {
                const decoded = app.jwt.decode(token) as any;

                if (decoded && decoded.id) {
                    const userFromDb = await PlayerController.findById(decoded.id);

                    if (userFromDb) {
                        socket.data = {
                            id: userFromDb.id,
                            nick: userFromDb.nick,
                            avatar: userFromDb.avatar || '',
                            gameAvatar: userFromDb.avatar || '',
                            skin: userFromDb.gang === 'potatoes' ? 'potato' : 'tomato',
                            gang: userFromDb.gang,
                            socketId: socket.id
                        };
                        return next();
                    }
                }
                return next(new Error("Authentication error: User not found"));
            } catch (e) {
                console.error("Socket Auth Error:", e);
                return next(new Error("Authentication error"));
            }
        });

        io.on('connection', (socket: Socket) => {

            socket.on('joinGame', (data: { roomId: string }) => {
                const roomId = data.roomId;

                socket.join(roomId);

                const room = io.sockets.adapter.rooms.get(roomId);

                if (room) {

                    if (room.size === 2) {
                        console.log(`[GAME START] Iniciando partida na sala ${roomId}`);
                        const [id1, id2] = Array.from(room);

                        const p1Socket = io.sockets.sockets.get(id1);
                        const p2Socket = io.sockets.sockets.get(id2);

                        if (p1Socket && p2Socket) {
                            const isRanked = roomId.startsWith('ranked_');
                            console.log(`[GAME] Tipo: ${isRanked ? 'Ranked' : 'Casual'}`);

                            const match = new PongMatch(
                                io,
                                roomId,
                                p1Socket.data,
                                p2Socket.data,
                                isRanked
                            );

                            activeMatches.set(p1Socket.id, match);
                            activeMatches.set(p2Socket.id, match);
                        }
                    } else {
                        console.log(`[SOCKET] Aguardando segundo jogador...`);
                    }
                } else {
                    console.log(`[SOCKET] Erro crítico: Sala ${roomId} não existe após join.`);
                }
            });

            socket.on('joinQueue', () => {
                if (waitingPlayer && waitingPlayer.id !== socket.id) {
                    console.log(`Iniciando Casual (FIFO): ${waitingPlayer.data.nick} vs ${socket.data.nick}`);

                    const roomId = `casual_fifo_${waitingPlayer.id}_${socket.id}`;

                    waitingPlayer.join(roomId);
                    socket.join(roomId);

                    const match = new PongMatch(
                        io,
                        roomId,
                        waitingPlayer.data,
                        socket.data,
                        false
                    );

                    activeMatches.set(waitingPlayer.id, match);
                    activeMatches.set(socket.id, match);

                    waitingPlayer = null;
                } else {
                    console.log('Entrou na fila casual rápida...');
                    waitingPlayer = socket;
                    socket.emit('matchStatus', 'waiting');
                }
            });

            socket.on('disconnect', () => {
                console.log(`[SOCKET] Cliente desconectado: ${socket.id}`);

                if (waitingPlayer === socket) {
                    waitingPlayer = null;
                }

                const match = activeMatches.get(socket.id);
                if (match) {
                    match.handleDisconnection(socket.id);
                    activeMatches.delete(match.p1SocketId);
                    activeMatches.delete(match.p2SocketId);
                }
            });
        });

        await app.listen({ port: 3333, host: '0.0.0.0' })
        console.log('🚀 Servidor rodando em http://localhost:3333')

    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
