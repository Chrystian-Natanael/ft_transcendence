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
import { leaderboardRoutes } from './routes/leaderboard.routes'

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

const app = fastify({ logger: true })

let waitingPlayer: Socket | null = null;

const activeMatches: Map<string, PongMatch> = new Map();

// Configuração do CORS
app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})

app.register(jwt, { secret: process.env.JWT_SECRET || 'JWT_SECRET' })
app.register(swaggerPlugin)


// --- DECORATORS DE AUTENTICAÇÃO ---
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

// --- REGISTRO DE ROTAS ---
app.register(zodValidator)

app.register(authRoutes, { prefix: '/auth' })
app.register(friendsRoutes, { prefix: '/friends' })
app.register(leaderboardRoutes, { prefix: '/leaderboards' })


// --- INICIALIZAÇÃO DO SERVIDOR E SOCKET.IO ---
const start = async () => {
    try {
        await app.ready();

        const io = new Server(app.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket: Socket) => {
            console.log('Cliente conectado:', socket.id);

            const decoded = socket.handshake.auth.token 
                ? app.jwt.decode(socket.handshake.auth.token) 
                : {};
            
            const userData = (decoded && typeof decoded === 'object') ? decoded : {};

            socket.data = { ...userData, socketId: socket.id };

            // Matchmaking
            if (waitingPlayer && waitingPlayer.id !== socket.id) {
                console.log(`Iniciando partida: ${waitingPlayer.data.nick} vs ${socket.data.nick}`);
                
                const roomId = `match_${waitingPlayer.id}_${socket.id}`;
                
                waitingPlayer.join(roomId);
                socket.join(roomId);

                const match = new PongMatch(io, roomId, waitingPlayer.data, socket.data);
                
                activeMatches.set(waitingPlayer.id, match);
                activeMatches.set(socket.id, match);
                
                waitingPlayer = null; 
            } else {
                console.log('Jogador aguardando oponente...');
                waitingPlayer = socket;
                socket.emit('matchStatus', 'waiting');
            }

           socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
                
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

        await app.listen({ port: 3333, host: '0.0.0.0' });
        console.log('🚀 Servidor rodando em http://localhost:3333');

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();