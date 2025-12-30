export const PowerUpType = {
    BIG_PADDLE: 'BIG_PADDLE',
    SHIELD: 'SHIELD',
    SPEED_BOOST: 'SPEED_BOOST',
} as const;

export type PowerUpType = typeof PowerUpType[keyof typeof PowerUpType];

export type PlayerSkin = 'potato' | 'tomato' | 'ai';

export interface PlayerState {
  id: string;
  y: number;
  score: number;
  height: number;
  shield: boolean;
  skin: PlayerSkin;
  nick: string;
  avatar?: string;
  gameAvatar?: string
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
