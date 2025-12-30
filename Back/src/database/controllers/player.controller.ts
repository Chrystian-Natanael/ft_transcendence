import { Player } from '@prisma/client';

import { prisma } from '../prisma';

export class PlayerController {
	static async create(data: {
		name: string;
		nick: string;
		email: string;
		password: string;
		isAnonymous?: boolean;
		gang: string;
		avatar?: string;
	}): Promise<Player> {
		return await prisma.player.create({
			data: {
				...data,
				isAnonymous: data.isAnonymous ?? false,
			},
		})
	}

	static async findById(id: number): Promise<Player | null> {
		return await prisma.player.findUnique({
			where: { id },
			include: {
				backupCodes: true,
				friendsAsPlayer1: true,
				friendsAsPlayer2: true,
				invitesSent: true,
				invitesReceived: true,
			},
		})
	}

	static async findByNick(nick: string): Promise<Player | null> {
		return await prisma.player.findUnique({
			where: { nick },
		})
	}

	static async findByEmail(email: string): Promise<Player | null> {
		return await prisma.player.findUnique({
			where: { email },
		})
	}

	static async findByIdentifier(identifier: string): Promise<Player | null> {
		return await prisma.player.findFirst({
			where: {
				OR: [
					{ email: identifier },
					{ nick: identifier },
				],
				isAnonymous: false,
			},
		})
	}

	static async update(id: number, data: Partial<Player>): Promise<Player> {
		return await prisma.player.update({
			where: { id },
			data,
		})
	}

	static async delete(id: number): Promise<Player> {
		return await prisma.player.delete({
			where: { id },
		})
	}

	static async updateActivity(id: number): Promise<void> {
		await prisma.player.update({
			where: { id },
			data: { lastActivity: new Date() },
		})
	}

	static async addBackupCodes(playerId: number, codes: string[]): Promise<void> {
		await prisma.backupCode.createMany({
			data: codes.map(code => ({
				idPlayer: playerId,
				code,
			})),
		})
	}

	static async removeBackupCode(playerId: number, code: string): Promise<void> {
		const backupCode = await prisma.backupCode.findFirst({
			where: { idPlayer: playerId, code },
		})

		if (backupCode) {
			await prisma.backupCode.delete({
				where: { id: backupCode.id },
			})
		}
	}

	static async getBackupCodes(playerId: number): Promise<string[]> {
		const codes = await prisma.backupCode.findMany({
			where: { idPlayer: playerId },
			select: { code: true },
		})
		return codes.map((c: { code: string }) => c.code)
	}

	static async getGameStats(playerId: number): Promise<{
		gamesWinned: number;
		gamesLosed: number;
		gamesPlayed: number;
	} | null> {
		const player = await prisma.player.findUnique({
			where: { id: playerId },
		})
		if (!player) return null;
		return {
			gamesWinned: player.gamesWinned,
			gamesLosed: player.gamesLosed,
			gamesPlayed: player.gamesPlayed,
		}
	}

	static async incrementGamesWon(playerId: number, points: number): Promise<void> {
		await prisma.player.update({
			where: { id: playerId },
			data: {
				gamesWinned: { increment: 1 },
				gamesPlayed: { increment: 1 },
				score: { increment: points }
			},
		})
	}

	static async incrementGamesLost(playerId: number, points: number): Promise<void> {
		await prisma.player.update({
			where: { id: playerId },
			data: {
				gamesLosed: { increment: 1 },
				gamesPlayed: { increment: 1 },
				score: { decrement: points }
			},
		})
	}

	static async updateGameStats(
		playerId: number,
		stats: {
			gamesWinned?: number;
			gamesLosed?: number;
			gamesPlayed?: number;
		}
	): Promise<Player> {
		return await prisma.player.update({
			where: { id: playerId },
			data: stats,
		})
	}

	static async getWinRate(playerId: number): Promise<number> {
		const stats = await this.getGameStats(playerId)
		if (!stats || stats.gamesPlayed === 0) return 0
		return (stats.gamesWinned / stats.gamesPlayed) * 100
	}
}
