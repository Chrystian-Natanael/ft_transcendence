import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../database/prisma';

interface LeaderboardItem {
    id: number;
    name: string;
    nick: string;
    avatar: string;
    score: number;
    gang: string;
    isOnline: boolean;
    rank: number;
}

export async function leaderboardRoutes(app: FastifyInstance) {

    app.get('/', {
        onRequest: [app.authenticate]
    }, async (req: FastifyRequest, reply) => {

        const allUsers = await prisma.player.findMany({
            orderBy: {
                score: 'desc'
            }
        });

        const leaderboardData: LeaderboardItem[] = allUsers.map((u, index) => ({
            id: u.id,
            name: u.name,
            nick: u.nick,
            avatar: u.avatar || '/assets/Profile_images/Potato_default.jpg',
            score: u.score,
            gang: u.gang,
            isOnline: u.isOnline,
            rank: index + 1
        }));

        return reply.send(leaderboardData);
    });
}
