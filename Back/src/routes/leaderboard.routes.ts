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
            avatar: u.avatar || 'src/assets/Profile_images/Potato_default.jpg',
            score: u.score || 0, 
            gang: u.gang,
            isOnline: u.isOnline ?? false,
            rank: 0
        }));

        leaderboardData.sort((a, b) => b.score - a.score);

        leaderboardData.forEach((user, index) => {
            user.rank = index + 1;
        });

        return reply.send(leaderboardData);
    });
}