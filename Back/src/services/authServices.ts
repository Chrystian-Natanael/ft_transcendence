import { Player } from '@prisma/client'
import crypto from 'crypto'
import { prisma } from '../database/prisma'

export class AuthService {

	static sanitizePlayer(user: Player) {
		return {
			id: user.id,
			name: user.name,
			nick: user.nick,
			email: user.isAnonymous ? undefined : user.email,
			isAnonymous: user.isAnonymous,
			gang: user.gang as 'potatoes' | 'tomatoes',
			has2FA: !!user.twoFAEnabled,

			avatar: user.avatar
		}
	}

	static generateBackupCodes(count: number = 8): string[] {
		const codes: string[] = []
		for (let i = 0; i < count; i++) {
			const code = crypto.randomBytes(4).toString('hex').toUpperCase()
			codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
		}
		return codes
	}

	static async cleanupInactiveAnonymous() {
		const ANONYMOUS_INACTIVITY_TIMEOUT = 5 * 60 * 1000
		const thresholdDate = new Date(Date.now() - ANONYMOUS_INACTIVITY_TIMEOUT);

		try {
			const result = await prisma.player.deleteMany({
				where: {
					isAnonymous: true,
					lastActivity: { lt: thresholdDate }
				}
			});
		} catch (error) {
			console.error("Erro ao limpar usuários anônimos:", error);
		}
	}

	static async updateActivity(userId: number) {
		try {
			await prisma.player.updateMany({
				where: { id: userId, isAnonymous: true },
				data: { lastActivity: new Date() }
			});
		} catch (error) {
			console.error(`Erro ao atualizar atividade:`, error);
		}
	}
}
