import { z } from 'zod'

export const nick = z.string()
	.min(3, 'Nick deve ter no mínimo 3 caracteres')
	.max(20, 'Nick deve ter no máximo 20 caracteres')
	.regex(/^[a-zA-Z0-9_]+$/, 'Nick deve conter apenas letras, números e underscores')

export const nickSchema = z.object({
	nick: nick
});
