
export const rankedMatchmakingRouteSchema = {
    tags: ['Game'],
    summary: 'Entrar na fila ranqueada',
    response: {
        200: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                roomId: { type: 'string' },
                message: { type: 'string' }
            }
        }
    }
};

export const inviteFriendRouteSchema = {
    tags: ['Game'],
    summary: 'Convidar amigo para jogar',
    body: {
        type: 'object',
        examples: [
            {
                nick: 'player123'
            }
        ]
    }
};

export const respondInviteRouteSchema = {
    tags: ['Game'],
    summary: 'Responder convite de jogo',
    body: {
        type: 'object',
        examples: [
            {
                nick: 'player123',
                action: 'accept'
            }
        ]
    }
};