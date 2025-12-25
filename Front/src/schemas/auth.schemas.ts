import { z } from 'zod'

import { nick } from './common.schemas'

const name = z.string()
	.min(3, 'Nome deve ter no mínimo 3 caracteres')
	.max(50, 'Nome deve ter no máximo 50 caracteres')
	.regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')

const email = z.email('Email inválido')

const identifier = z.union([email, nick], {
	message: 'Identificador deve ser um email válido ou um nick válido'
})

const password = z.string()
	.min(8, 'Senha deve ter no mínimo 8 caracteres')
	.regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
	.regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
	.regex(/[0-9]/, 'Senha deve conter ao menos um número')
	.regex(/[\W_]/, 'Senha deve conter ao menos um caractere especial')

const gang = z.enum(['potatoes', 'tomatoes'], {
	message: 'Gang deve ser "potatoes" ou "tomatoes"'
})

const tokenValidation = z.string()
	.length(6, 'Token deve ter 6 digitos')
	.regex(/^[0-9]+$/, 'Token deve conter apenas números')

const backupCodeValidation = z.string()
	.length(9, 'Backup code deve ter 9 caracteres no formato XXXX-XXXX')
	.regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 'Backup code deve estar no formato XXXX-XXXX')

const twoFATokenValidation = z.union([tokenValidation, backupCodeValidation], {
	message: 'Token deve ser um código de 6 dígitos ou um backup code (formato: XXXX-XXXX)'
})

export const registerSchema = z.object({
	name: name,
	nick: nick,
	email: email,
	password: password,
	gang: gang
})

export const loginSchema = z.object({
	identifier: identifier,
	password: password
})

export const anonymousSchema = z.object({
	nick: nick
})

export const enable2FASchema = z.object({
	token: tokenValidation,
	secret: z.string()
		.min(16, 'Secret deve ter no mínimo 16 caracteres')
})

export const disable2FASchema = z.object({
	token: twoFATokenValidation
})

export const login2FASchema = z.object({
	token: twoFATokenValidation
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AnonymousInput = z.infer<typeof anonymousSchema>

export type Enable2FAInput = z.infer<typeof enable2FASchema>
export type Disable2FAInput = z.infer<typeof disable2FASchema>
export type Login2FAInput = z.infer<typeof login2FASchema>
