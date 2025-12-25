import { z } from 'zod'

import { nick } from './common.schemas'

export const FriendRequestSchema = z.object({
	nick: nick
})

export const FriendResponseSchema = z.object({
	nick: nick,

	action: z.enum(['accept', 'decline'], {
		message: 'Ação deve ser "accept" ou "decline"'
	})
})

const idValidation = z.string()
	.regex(/^\d+$/, 'ID deve conter apenas números')
	.transform(Number)
	.refine(val => val > 0, 'ID deve ser maior que zero')

export const UserIDSchema = z.object({
	id: idValidation
})

export type FriendRequestInput = z.infer<typeof FriendRequestSchema>
export type FriendResponseInput = z.infer<typeof FriendResponseSchema>
export type UserIDSchemaInput = z.infer<typeof UserIDSchema>
