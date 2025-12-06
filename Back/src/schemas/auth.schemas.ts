import { z } from 'zod'

export const registerSchema = z.object({
	name: z.string()
		.min(3, 'Nome deve ter no mínimo 3 caracteres')
		.max(50, 'Nome deve ter no máximo 50 caracteres')
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),

	nick: z.string()
		.min(3, 'Nick deve ter no mínimo 3 caracteres')
		.max(20, 'Nick deve ter no máximo 20 caracteres')
		.regex(/^[a-zA-Z0-9_]+$/, 'Nick deve conter apenas letras, números e underscores'),

	email: z.email('Email inválido'),

	password: z.string()
		.min(8, 'Senha deve ter no mínimo 8 caracteres')
		.regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
		.regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
		.regex(/[0-9]/, 'Senha deve conter ao menos um número')
		.regex(/[\W_]/, 'Senha deve conter ao menos um caractere especial'),

	gang: z.enum(['batatas', 'tomates'], {
		message: 'Gang deve ser "batatas" ou "tomates"'
	})
})

export const loginSchema = z.object({
	identifier: z.string()
		.min(2, 'Identificador deve ter no mínimo 2 caracteres'),

	password: z.string()
		.min(8, 'Senha deve ter no mínimo 8 caracteres')
})

export const anonymousSchema = z.object({
	nick: z.string()
		.min(3, 'Nome deve ter no mínimo 3 caracteres')
		.max(50, 'Nome deve ter no máximo 50 caracteres')
		.regex(/^[a-zA-Z0-9_]+$/, 'Nick deve conter apenas letras, números e underscore'),
})

const tokenValidation = z.string()
	.length(6, 'Token deve ter 6 digitos')
	.regex(/^[0-9]+$/, 'Token deve conter apenas números')

export const enable2FASchema = z.object({
	token: tokenValidation,
	secret: z.string()
		.min(16, 'Secret deve ter no mínimo 16 caracteres')
})

export const disable2FASchema = z.object({
	token: tokenValidation
})

export const login2FASchema = z.object({
	token: z.string()
		.refine(
			(val) => {
				const isTOTP = /^\d{6}$/.test(val)
				const isBackupCode = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(val)
				return isTOTP || isBackupCode
			},
			{
				message: 'Token deve ser um código de 6 dígitos ou um backup code (formato: XXXX-XXXX)'
			}
		)
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AnonymousInput = z.infer<typeof anonymousSchema>

export type Enable2FAInput = z.infer<typeof enable2FASchema>
export type Disable2FAInput = z.infer<typeof disable2FASchema>
export type Login2FAInput = z.infer<typeof login2FASchema>
