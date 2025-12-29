import { z } from 'zod';
import { nick } from './common.schemas';

export const GameInviteSchema = z.object({
    nick: nick
});

export const GameResponseSchema = z.object({
    nick: nick,
    action: z.enum(['accept', 'decline'] as const, {
        message: "Ação deve ser 'accept' ou 'decline'"
    }),
});

export type GameInviteInput = z.infer<typeof GameInviteSchema>;
export type GameResponseInput = z.infer<typeof GameResponseSchema>;