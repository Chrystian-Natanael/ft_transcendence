import crypto from 'crypto'

import { Player } from '@prisma/client'

import { db, User } from '../database/memoryDB'

export class AuthService {

	static sanitizeUser(user: User) {
		return {
			id: user.id,
			name: user.name,
			nick: user.nick,
			email: user.isAnonymous ? undefined : user.email,
			isAnonymous: user.isAnonymous,
			gang: user.gang,
			has2FA: !!user.twoFactorEnabled,
			avatar: user.avatar
		}
	}

	static sanitizePlayer(user: Player) {
		return {
			id: user.id,
			name: user.name,
			nick: user.nick,
			email: user.isAnonymous ? undefined : user.email,
			isAnonymous: user.isAnonymous,
			gang: user.gang,
			has2FA: !!user.twoFAEnabled
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

	static cleanupInactiveAnonymous() {
		const ANONYMOUS_INACTIVITY_TIMEOUT = 5 * 60 * 1000
		const now = Date.now()

		const allUsers = db.getAllUsers()

		const activeUsers = allUsers.filter(user => {
			if (!user.isAnonymous) return true
			if (!user.lastActivity) return false
			return (now - user.lastActivity < ANONYMOUS_INACTIVITY_TIMEOUT)
		})

		if (activeUsers.length < allUsers.length) {
			db.setUsers(activeUsers)
			console.log(`Limpou ${allUsers.length - activeUsers.length} usuários anônimos inativos.`)
		}
	}

	static async updateActivity(userId: number) {
		const user = await db.findUserById(userId)

		if (user && user.isAnonymous) {
			user.lastActivity = Date.now()
		}
	}
}
