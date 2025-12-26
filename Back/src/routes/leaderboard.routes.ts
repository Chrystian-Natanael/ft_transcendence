import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../database/memoryDB';

export async function leaderboardRoutes(app: FastifyInstance) {

    app.get('/', {
        onRequest: [app.authenticate]
    }, async (req: FastifyRequest, reply) => {

        const allUsers = db.getAllUsers();

        const leaderboardData = allUsers.map(u => ({
            id: u.id,
            name: u.name,
            nick: u.nick,
            // Mock de avatar (futuramente virá do banco/upload)
            avatar: 'src/assets/perfil-sla.png', 
            score: u.score || 0, 
            gang: u.gang,
            // Mock de status (futuramente virá de um sistema de presença/socket)
            isOnline: true, 
            rank: 0
        }));

        leaderboardData.sort((a, b) => b.score - a.score);

        leaderboardData.forEach((user, index) => {
            user.rank = index + 1;
        });

        return reply.send(leaderboardData);
    });
}