// src/routes/friends.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, User } from '../database/memoryDB';
import { AuthService } from '../services/authServices';

import {
    FriendRequestInput, FriendRequestSchema,
    FriendResponseInput, FriendResponseSchema,
    UserIDSchema, UserIDSchemaInput
} from '../schemas/friends.schemas';

import {
    friendsListRouteSchema, getUserByIdRouteSchema,
    sendFriendRequestRouteSchema, respondFriendRequestRouteSchema,
    removeFriendRouteSchema
} from '../schemas/swagger/friends.route.schemas';

function sanitizeFriends(user: User) {
    return {
        id: user.id,
        nick: user.nick,
        gang: user.gang,
        isOnline: true,
        avatar: 'src/assets/perfil-sla.png'
    };
}

function sanitizeRequestsFriends(user: User) {
    return {
        id: user.id,
        nick: user.nick,
        avatar: 'src/assets/perfil-sla.png'
    };
}

export async function friendsRoutes(app: FastifyInstance) {

    const verifyUser = async (req: FastifyRequest, reply: FastifyReply) => {
        const user = await db.findUserById(req.user.id);
        if (!user) {
            return reply.code(404).send({ error: 'Usuário não autenticado' });
        }
    };

    // --- LISTAR AMIGOS ---
    app.get('/list', {
        onRequest: [app.authenticate],
        preHandler: [verifyUser],
        schema: friendsListRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const currentUser = (await db.findUserById(req.user.id))!;
        
        // getAllUsers continua síncrono no MemoryDB por enquanto, 
        // mas num banco SQL seria await db.getFriendsOf(currentUser.id)
        const allUsers = db.getAllUsers();

        const myFriends = allUsers
            .filter(u => currentUser.friends.includes(u.id))
            .map(u => sanitizeFriends(u));

        return reply.send(myFriends);
    });

    app.get('/users/:id', {
        onRequest: [app.authenticate],
        preHandler: [verifyUser, app.validateParams(UserIDSchema)],
        schema: getUserByIdRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const { id } = req.params as UserIDSchemaInput;

        const user = await db.findUserById(Number(id)); 
        if (!user) {
            return reply.code(404).send({ error: 'Usuário não encontrado' });
        }

        return reply.send(AuthService.sanitizeUser(user));
    });

    // --- ENVIAR SOLICITAÇÃO ---
    app.post('/request', {
        onRequest: [app.authenticate],
        preHandler: [verifyUser, app.validateBody(FriendRequestSchema)],
        schema: sendFriendRequestRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const { nick } = req.body as FriendRequestInput;
        
        const sender = (await db.findUserById(req.user.id))!;
        
        // findUserByNick ainda é síncrono no seu MemoryDB atual, 
        // mas se mudar para SQL, lembre de por await aqui também.
        const target = db.findUserByNick(nick);

        if (!target) return reply.code(404).send({ error: 'Usuário alvo não encontrado' });
        if (target.id === sender.id) return reply.code(400).send({ error: 'Você não pode adicionar a si mesmo' });
        if (sender.friends.includes(target.id)) return reply.code(400).send({ error: 'Vocês já são amigos' });
        if (sender.friendRequestsSent.includes(target.id)) return reply.code(400).send({ error: 'Solicitação já enviada' });
        if (sender.friendRequestsReceived.includes(target.id)) return reply.code(400).send({ error: 'Este usuário já te enviou uma solicitação. Aceite-a.' });

        sender.friendRequestsSent.push(target.id);
        target.friendRequestsReceived.push(sender.id);

        return reply.send({ message: `Solicitação enviada para ${target.nick}` });
    });

    // --- RESPONDER SOLICITAÇÃO ---
    app.post('/response', {
        onRequest: [app.authenticate],
        preHandler: [verifyUser, app.validateBody(FriendResponseSchema)],
        schema: respondFriendRequestRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const { nick, action } = req.body as FriendResponseInput;
        
        const currentUser = (await db.findUserById(req.user.id))!;
        const requester = db.findUserByNick(nick);

        if (!requester) return reply.code(404).send({ error: 'Usuário não encontrado' });
        if (!currentUser.friendRequestsReceived.includes(requester.id)) return reply.code(400).send({ error: 'Não há solicitação pendente deste usuário' });

        currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(id => id !== requester.id);
        requester.friendRequestsSent = requester.friendRequestsSent.filter(id => id !== currentUser.id);

        if (action === 'accept') {
            currentUser.friends.push(requester.id);
            requester.friends.push(currentUser.id);
            return reply.send({ message: `Agora você e ${requester.nick} são amigos!` });
        } else {
            return reply.send({ message: 'Solicitação recusada' });
        }
    });

    // --- REMOVER AMIGO ---
    app.delete('/remove/:id', {
        onRequest: [app.authenticate],
        preHandler: [verifyUser, app.validateParams(UserIDSchema)],
        schema: removeFriendRouteSchema
    }, async (req: FastifyRequest, reply) => {
        const { id } = req.params as UserIDSchemaInput;
        const friendId = Number(id);

        const currentUser = (await db.findUserById(req.user.id))!;
        const targetUser = await db.findUserById(friendId);

        if (!targetUser) return reply.code(404).send({ error: 'Usuário não encontrado' });
        if (!currentUser.friends.includes(friendId)) return reply.code(400).send({ error: 'Vocês não são amigos' });

        currentUser.friends = currentUser.friends.filter(fid => fid !== friendId);
        targetUser.friends = targetUser.friends.filter(fid => fid !== currentUser.id);

        console.log(`${currentUser.nick} removeu ${targetUser.nick} dos amigos.`);
        return reply.send({ message: 'Amizade desfeita com sucesso' });
    });

    // --- LISTAR SOLICITAÇÕES RECEBIDAS ---
    app.get('/requests/received', {
        onRequest: [app.authenticate],
        preHandler: [verifyUser],
    }, async (req: FastifyRequest, reply) => {
        const currentUser = (await db.findUserById(req.user.id))!;
        const allUsers = db.getAllUsers();

        const incomingRequests = allUsers
            .filter(u => currentUser.friendRequestsReceived.includes(u.id))
            .map(u => sanitizeRequestsFriends(u));

        return reply.send(incomingRequests);
    });
}