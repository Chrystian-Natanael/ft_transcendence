export const registerBodySchema = {
	type: 'object',
	required: ['name', 'nick', 'email', 'password', 'gang'],
	properties: {
		name: {
			type: 'string',
			minLength: 3,
			maxLength: 50,
			description: 'Nome completo do usuário',
			examples: ['João Silva']
		},
		nick: {
			type: 'string',
			minLength: 3,
			maxLength: 20,
			description: 'Apelido único',
			examples: ['joao123']
		},
		email: {
			type: 'string',
			format: 'email',
			description: 'Email válido',
			examples: ['joao@example.com']
		},
		password: {
			type: 'string',
			minLength: 8,
			description: 'Senha forte',
			examples: ['Senha@123']
		},
		gang: {
			type: 'string',
			enum: ['batatas', 'tomates'],
			description: 'Gangue do usuário',
			examples: ['batatas']
		}
	}
} as const

export const loginBodySchema = {
	type: 'object',
	required: ['identifier', 'password'],
	properties: {
		identifier: {
			type: 'string',
			minLength: 2,
			description: 'Email ou nick do usuário',
			examples: ['joao123', 'joao@example.com']
		},
		password: {
			type: 'string',
			minLength: 8,
			description: 'Senha do usuário',
			examples: ['Senha@123']
		}
	}
} as const

export const anonymousBodySchema = {
	type: 'object',
	required: ['nick'],
	properties: {
		nick: {
			type: 'string',
			minLength: 3,
			maxLength: 50,
			description: 'Apelido temporário',
			examples: ['visitante', 'player1']
		}
	}
} as const
