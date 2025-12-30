import {
    anonymousBodySchema,
    loginBodySchema,
    registerBodySchema
} from './request.schemas'
import {
    userResponseSchema
} from './response.schemas'

export const registerRouteSchema = {
    tags: ['auth'],
    summary: 'Registrar novo usuário',
    description: 'Cria uma nova conta de usuário permanente com gangue escolhida',
    body: registerBodySchema,
    response: {
        200: {
            description: 'Usuário criado com sucesso',
            ...userResponseSchema
        },
        400: {
            description: 'Nick ou email já em uso, ou validação falhou',
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    examples: ['Nick já em uso', 'Email já cadastrado', 'Validação falhou']
                },
                details: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            field: { type: 'string', examples: ['email', 'password', 'nick'] },
                            message: { type: 'string', examples: ['Email inválido', 'Senha deve ter ao menos uma letra maiúscula'] }
                        }
                    }
                }
            }
        }
    }
} as const

export const loginRouteSchema = {
    tags: ['auth'],
    summary: 'Fazer login',
    description: 'Autentica um usuário usando email ou nick. Se 2FA estiver ativado, retorna token temporário.',
    body: loginBodySchema,
    response: {
        200: {
            description: 'Login bem-sucedido ou requer 2FA',
            type: 'object',
            properties: {
                token: { type: 'string' },
                user: userResponseSchema,
                requires2FA: { type: 'boolean' },
                tempToken: { type: 'string' },
                message: { type: 'string' }
            }
        },
        400: {
            description: 'Validação falhou',
            type: 'object',
            properties: {
                error: { type: 'string', examples: ['Validação falhou'] }
            }
        },
        401: {
            description: 'Credenciais inválidas',
            type: 'object',
            properties: {
                error: { type: 'string', examples: ['Credenciais inválidas'] }
            }
        },
        404: {
            description: 'Usuário não encontrado',
            type: 'object',
            properties: {
                error: { type: 'string', examples: ['Credenciais inválidas'] }
            }
        }
    }
} as const

export const login2FARouteSchema = {
    tags: ['auth'],
    summary: 'Finalizar login 2FA',
    description: 'Troca o token temporário (recebido no login) e o código OTP pelo token de sessão final.',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        required: ['token'],
        properties: {
            token: { type: 'string', description: 'Código de 6 dígitos do autenticador ou Backup Code' }
        }
    },
    response: {
        200: {
            description: 'Autenticação 2FA realizada com sucesso',
            type: 'object',
            properties: {
                token: { type: 'string' },
                user: userResponseSchema
            }
        },
        400: {
            description: 'Token inválido ou 2FA não habilitado',
            type: 'object',
            properties: {
                error: { type: 'string', examples: ['Token inválido', '2FA não está habilitado'] }
            }
        },
        401: {
            description: 'Token temporário expirado ou inválido',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
} as const

export const anonymousRouteSchema = {
    tags: ['auth'],
    summary: 'Login anônimo',
    description: 'Cria uma sessão temporária sem registro. Todos anônimos pertencem à gangue "potatoes". Sessão expira em 2h ou após 5min de inatividade.',
    body: anonymousBodySchema,
    response: {
        200: {
            description: 'Sessão anônima criada com sucesso',
            type: 'object',
            properties: {
                token: {
                    type: 'string',
                    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...']
                },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', examples: [2] },
                        name: { type: 'string', examples: ['anonymous_visitante'] },
                        nick: { type: 'string', examples: ['anonymous_visitante'] },
                        isAnonymous: { type: 'boolean', examples: [true] },
                        gang: { type: 'string', examples: ['potatoes'] }
                    }
                }
            }
        },
        400: {
            description: 'Nick já em uso ou validação falhou',
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    examples: ['Nick já está em uso', 'Validação falhou']
                },
                details: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            field: { type: 'string', examples: ['nick'] },
                            message: { type: 'string', examples: ['Nome deve ter no mínimo 3 caracteres', 'Nick deve conter apenas letras, números e underscore'] }
                        }
                    }
                }
            }
        }
    }
} as const

export const logoutRouteSchema = {
    tags: ['auth'],
    summary: 'Fazer logout',
    description: 'Encerra a sessão do usuário. Remove permanentemente usuários anônimos.',
    security: [{ bearerAuth: [] }],
    response: {
        200: {
            description: 'Logout realizado com sucesso',
            type: 'null'
        },
        401: {
            description: 'Token inválido',
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    examples: ['Token Inválido']
                }
            }
        },
        404: {
            description: 'Usuário não encontrado',
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    examples: ['Usuário não encontrado']
                }
            }
        }
    }
} as const

// --- Schemas de Gerenciamento de 2FA ---

export const setup2FARouteSchema = {
    tags: ['auth'],
    summary: 'Iniciar configuração 2FA',
    description: 'Gera um segredo e um QR Code para o usuário escanear no aplicativo autenticador.',
    security: [{ bearerAuth: [] }],
    response: {
        200: {
            description: 'QR Code gerado com sucesso',
            type: 'object',
            properties: {
                secret: { type: 'string' },
                qrcode: { type: 'string', description: 'URL Data URI da imagem do QR Code' }
            }
        },
        400: {
            description: '2FA já está habilitado',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
} as const

export const enable2FARouteSchema = {
    tags: ['auth'],
    summary: 'Confirmar e ativar 2FA',
    description: 'Recebe o token do app autenticador e o segredo gerado no setup para ativar definitivamente o 2FA.',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        required: ['token', 'secret'],
        properties: {
            token: { type: 'string', description: 'Código do autenticador' },
            secret: { type: 'string', description: 'Segredo gerado no setup' }
        }
    },
    response: {
        200: {
            description: '2FA ativado com sucesso',
            type: 'object',
            properties: {
                message: { type: 'string' },
                backupCodes: { type: 'array', items: { type: 'string' } }
            }
        },
        400: {
            description: 'Token inválido ou erro de validação',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
} as const

export const disable2FARouteSchema = {
    tags: ['auth'],
    summary: 'Desativar 2FA',
    description: 'Desativa a autenticação de dois fatores. Requer um token válido para confirmar.',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        required: ['token'],
        properties: {
            token: { type: 'string', description: 'Código do autenticador' }
        }
    },
    response: {
        200: {
            description: '2FA desativado com sucesso',
            type: 'object',
            properties: {
                message: { type: 'string' }
            }
        },
        400: {
            description: 'Token inválido ou 2FA não ativo',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
} as const

export const deleteAccountRouteSchema = {
    tags: ['auth'],
    summary: 'Deletar conta',
    description: 'Exclui permanentemente a conta do usuário. Requer senha e, se ativo, o token 2FA.',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        properties: {
            password: { type: 'string' },
            token: { type: 'string', description: 'Obrigatório se 2FA estiver ativo' }
        }
    },
    response: {
        200: {
            description: 'Conta deletada com sucesso',
            type: 'object',
            properties: {
                message: { type: 'string' }
            }
        },
        400: {
            description: 'Dados inválidos (Senha incorreta ou Token inválido)',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
} as const