// Back/src/types/game.ts

export const PowerUpType = {
    BIG_PADDLE: 'BIG_PADDLE',
    SHIELD: 'SHIELD',
    SPEED_BOOST: 'SPEED_BOOST',
} as const;

export type PowerUpType = typeof PowerUpType[keyof typeof PowerUpType];

export type PlayerSkin = 'potato' | 'tomato' | 'ai';

export interface PlayerState {
  id: string;      // Socket ID
  y: number;       // Posição vertical (0 a 100 ou pixels)
  score: number;
  height: number;  // Altura da raquete
  shield: boolean; // Se tem barreira ativada
  skin: PlayerSkin;
  nick: string;    // Nome do jogador para exibir
  avatar?: string; // URL da foto do jogador
  gameAvatar?: string // Avatar de jogo
}

export interface GameState {
  ball: { 
    x: number; 
    y: number; 
  };
  player1: PlayerState;
  player2: PlayerState;
  powerUp: {
    active: boolean;
    x: number;
    y: number;
    type: PowerUpType;
  } | null;
  tableWidth: number;
  tableHeight: number;
}