import { Player } from '@prisma/client';

import { prisma } from '../prisma';

export class PlayerController {
	// Create player
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

	// Find by ID
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

	// Find by nick
	static async findByNick(nick: string): Promise<Player | null> {
		return await prisma.player.findUnique({
			where: { nick },
		})
	}

	// Find by email
	static async findByEmail(email: string): Promise<Player | null> {
		return await prisma.player.findUnique({
			where: { email },
		})
	}

	// Find by email or nick
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

	// Update player
	static async update(id: number, data: Partial<Player>): Promise<Player> {
		return await prisma.player.update({
			where: { id },
			data,
		})
	}

	// Delete player
	static async delete(id: number): Promise<Player> {
		return await prisma.player.delete({
			where: { id },
		})
	}

	// Update last activity
	static async updateActivity(id: number): Promise<void> {
		await prisma.player.update({
			where: { id },
			data: { lastActivity: new Date() },
		})
	}

	// Add backup codes
	static async addBackupCodes(playerId: number, codes: string[]): Promise<void> {
		await prisma.backupCode.createMany({
			data: codes.map(code => ({
				idPlayer: playerId,
				code,
			})),
		})
	}

	// Remove used backup code
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

	// Get backup codes
	static async getBackupCodes(playerId: number): Promise<string[]> {
		const codes = await prisma.backupCode.findMany({
			where: { idPlayer: playerId },
			select: { code: true },
		})
		return codes.map(c => c.code)
	}
}
