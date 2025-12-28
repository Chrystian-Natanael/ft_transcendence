import { state } from '../store/appState';
import type { GameState } from '../types/game';
import { PowerUpType } from '../types/game';

import imgBlueBall from '../assets/blueball.png';
import imgRedBall from '../assets/redball.png';

// Constantes
const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 600;
const PADDLE_SPEED = 10;
const MAX_SPEED = 25;
const WIN_SCORE = 5;
const DEFAULT_PADDLE_HEIGHT = 130;
const BALL_RADIUS = 10;

// Assets da IA
const AI_PROFILE_PIC = imgBlueBall; 
const AI_GAME_AVATAR = imgRedBall;

type GameEventHandler = (event: string, data: any) => void;

export class LocalGameEngine {
  private state: GameState;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private eventListeners: Record<string, GameEventHandler[]> = {};
  
  private isRunning: boolean = false;

  private p1MoveDir: number = 0;
  private aiMoveDir: number = 0;
  
  private isBallMoving: boolean = false;
  private ballSpeed: number = 5;
  private ballDir = { x: 0, y: 0 };
  
  private lastHitterId: string | null = null;
  private powerUpTimeout: any = null;
  private difficulty: 1 | 2 | 3; 

  constructor(difficulty: number) {
    this.difficulty = difficulty as 1 | 2 | 3;
    
    const myNick = state.user?.nick || 'Você';
    const myProfilePic = state.user?.avatar || '/assets/default-avatar.png';
    const myGameAvatar = state.user?.gameAvatar || imgRedBall;

    this.state = {
      tableWidth: TABLE_WIDTH,
      tableHeight: TABLE_HEIGHT,
      ball: { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2 },
      
      player1: { 
          id: 'p1', 
          y: 250, 
          score: 0, 
          height: DEFAULT_PADDLE_HEIGHT, 
          shield: false, 
          nick: myNick,
          avatar: myProfilePic,     
          gameAvatar: myGameAvatar, 
          skin: 'tomato' 
      },
      
      // (IA - C.A.D.E.T.E.)
      player2: { 
          id: 'cpu', 
          y: 250, 
          score: 0, 
          height: DEFAULT_PADDLE_HEIGHT, 
          shield: false, 
          nick: 'C.A.D.E.T.E.', 
          avatar: AI_PROFILE_PIC,
          gameAvatar: AI_GAME_AVATAR,
          skin: 'potato' 
      },
      
      powerUp: null
    };
  }

  public on(event: string, callback: GameEventHandler) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  }

  public emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(event, data));
    }
  }

  public movePaddle(direction: 'UP' | 'DOWN' | 'STOP') {
    const dirValue = direction === 'UP' ? -1 : (direction === 'DOWN' ? 1 : 0);
    this.p1MoveDir = dirValue;
  }

  public start() {
    this.startRoundTimer();
    this.lastTime = performance.now();
    
    this.isRunning = true;
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    this.isBallMoving = false;
    
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }
    clearTimeout(this.powerUpTimeout);
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const deltaTime = (timestamp - this.lastTime) / 16.66;
    this.lastTime = timestamp;

    this.updateAI();
    this.updatePaddles(deltaTime);

    if (this.isBallMoving) {
      if (this.ballSpeed < MAX_SPEED) {
        this.ballSpeed += 0.005 * deltaTime;
      }
      this.updateBallPhysics(deltaTime);
      this.checkCollisions();
      
      if (this.isBallMoving) {
          this.checkGoal();
      }
    }

    this.emit('gameState', this.state);
    
    if (this.isRunning) {
        this.animationId = requestAnimationFrame(this.loop);
    }
  };

  private updateAI() {
    const ai = this.state.player2;
    const ball = this.state.ball;
    
    const canSeeBall = this.ballDir.x > 0 && ball.x > TABLE_WIDTH / 3;

    if (!canSeeBall) {
        this.aiMoveDir = 0;
        return;
    }

    const aiCenter = ai.y + (ai.height / 2);
    let errorMargin = 0; 
    
    switch(this.difficulty) {
        case 1: errorMargin = 90; break;
        case 2: errorMargin = 60; break;
        case 3: errorMargin = 30; break;
    }

    const targetY = ball.y + (Math.random() * errorMargin - errorMargin/2);

    if (aiCenter < targetY - 15) {
        this.aiMoveDir = 1;
    } else if (aiCenter > targetY + 15) {
        this.aiMoveDir = -1;
    } else {
        this.aiMoveDir = 0;
    }
  }

  private updatePaddles(dt: number) {
    const p1 = this.state.player1;
    const ai = this.state.player2;
    
    if (this.p1MoveDir !== 0) {
      p1.y += this.p1MoveDir * PADDLE_SPEED * dt;
      p1.y = Math.max(0, Math.min(this.state.tableHeight - p1.height, p1.y));
    }
    
    let aiSpeedFactor = 1.0;
    if (this.difficulty === 1) aiSpeedFactor = 0.55; 
    else if (this.difficulty === 2) aiSpeedFactor = 0.85; 
    else if (this.difficulty === 3) aiSpeedFactor = 1.30; 

    if (this.aiMoveDir !== 0) {
      ai.y += this.aiMoveDir * (PADDLE_SPEED * aiSpeedFactor) * dt;
      ai.y = Math.max(0, Math.min(this.state.tableHeight - ai.height, ai.y));
    }
  }

private updateBallPhysics(dt: number) {
    this.state.ball.x += this.ballDir.x * this.ballSpeed * dt;
    this.state.ball.y += this.ballDir.y * this.ballSpeed * dt;

    if (this.state.ball.y - BALL_RADIUS <= 0) {
        this.state.ball.y = BALL_RADIUS;
        this.ballDir.y = Math.abs(this.ballDir.y);
    } 
    else if (this.state.ball.y + BALL_RADIUS >= this.state.tableHeight) {
        this.state.ball.y = this.state.tableHeight - BALL_RADIUS;
        this.ballDir.y = -Math.abs(this.ballDir.y);
    }
  }

  private checkCollisions() {
    const ball = this.state.ball;
    const p1 = this.state.player1;
    const ai = this.state.player2;

    // Colisão P1 (Esquerda)
    if (ball.x - BALL_RADIUS <= 20 && ball.x + BALL_RADIUS >= 10) {
        if (ball.y + BALL_RADIUS >= p1.y && ball.y - BALL_RADIUS <= p1.y + p1.height) {
            this.handlePaddleHit(p1, 1);
        }
    } 
    else if (p1.shield && ball.x - BALL_RADIUS <= 15) {
       this.ballDir.x = Math.abs(this.ballDir.x);
       p1.shield = false;
       this.lastHitterId = p1.id;
    }

    // Colisão IA (Direita)
    const aiX = this.state.tableWidth - 20;
    if (ball.x + BALL_RADIUS >= aiX && ball.x - BALL_RADIUS <= aiX + 10) {
        if (ball.y + BALL_RADIUS >= ai.y && ball.y - BALL_RADIUS <= ai.y + ai.height) {
            this.handlePaddleHit(ai, -1);
        }
    } 
    else if (ai.shield && ball.x + BALL_RADIUS >= this.state.tableWidth - 15) {
       this.ballDir.x = -Math.abs(this.ballDir.x);
       ai.shield = false;
       this.lastHitterId = ai.id;
    }

    // PowerUp
    if (this.state.powerUp && this.state.powerUp.active) {
       const dist = Math.hypot(ball.x - this.state.powerUp.x, ball.y - this.state.powerUp.y);
       if (dist < 30) {
          const owner = this.lastHitterId === p1.id ? p1 : ai;
          if (this.lastHitterId) this.activatePowerUp(owner);
       }
    }
  }

  private handlePaddleHit(player: any, direction: 1 | -1) {
    let collidePoint = (this.state.ball.y - (player.y + player.height / 2));
    collidePoint = collidePoint / (player.height / 2);
    const angleRad = (Math.PI / 4) * collidePoint;

    this.ballDir.x = direction * Math.cos(angleRad);
    this.ballDir.y = Math.sin(angleRad);
    this.ballSpeed = Math.min(this.ballSpeed * 1.05, MAX_SPEED);
    this.lastHitterId = player.id;
  }

  private checkGoal() {
    if (this.state.ball.x < -20) {
        this.handleScore('player2');
    }
    else if (this.state.ball.x > this.state.tableWidth + 20) {
        this.handleScore('player1');
    }
  }

  private handleScore(scorer: 'player1' | 'player2') {
    this.isBallMoving = false;
    
    if (scorer === 'player1') this.state.player1.score++;
    else this.state.player2.score++;

    this.emit('scoreUpdate', { scorer });

    if (this.state.player1.score >= WIN_SCORE || this.state.player2.score >= WIN_SCORE) {
        this.stop();
        this.emit('gameOver', {
            winnerId: scorer === 'player1' ? 'p1' : 'cpu',
            message: scorer === 'player1' ? 'Você Venceu!' : 'A CPU Venceu!'
        });
    } else {
        this.startRoundTimer();
    }
  }

  private startRoundTimer() {
    this.isBallMoving = false;
    this.lastHitterId = null; 
    this.state.ball = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2 };
    this.ballSpeed = 5;
    this.ballDir = { x: 0, y: 0 };

    let countdown = 3;
    const timer = setInterval(() => {
        if (!this.isRunning) {
            clearInterval(timer);
            return;
        }

        this.emit('matchStatus', `starting:${countdown}`);
        if (countdown <= 0) {
            clearInterval(timer);
            this.startBall();
        }
        countdown--;
    }, 1000);
  }

  private startBall() {
    if (!this.isRunning) return;

    this.isBallMoving = true;
    this.emit('matchStatus', 'playing');
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); 
    this.ballDir = { 
        x: dirX * Math.cos(angle), 
        y: Math.sin(angle) 
    };
    
    this.schedulePowerUp();
  }

  private schedulePowerUp() {
      clearTimeout(this.powerUpTimeout);
      if (!this.isBallMoving || !this.isRunning) return;
      
      const randomTime = Math.random() * (10000 - 5000) + 5000;
      this.powerUpTimeout = setTimeout(() => {
          if (!this.state.powerUp && this.isBallMoving && this.isRunning) this.spawnPowerUp();
          if (this.isBallMoving && this.isRunning) this.schedulePowerUp();
      }, randomTime);
  }

  private spawnPowerUp() {
    const types = [PowerUpType.BIG_PADDLE, PowerUpType.SHIELD, PowerUpType.SPEED_BOOST];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const x = 200 + Math.random() * (this.state.tableWidth - 400);
    const y = 100 + Math.random() * (this.state.tableHeight - 200);
    
    this.state.powerUp = { active: true, x, y, type: randomType };
    
    setTimeout(() => {
        if (this.state.powerUp && this.state.powerUp.x === x) {
            this.state.powerUp = null;
        }
    }, 6000);
  }

  private activatePowerUp(player: any) {
    if (!this.state.powerUp) return;
    const type = this.state.powerUp.type;
    this.state.powerUp = null;

    if (type === PowerUpType.BIG_PADDLE) {
        player.height = 180;
        setTimeout(() => player.height = DEFAULT_PADDLE_HEIGHT, 5000);
    } else if (type === PowerUpType.SHIELD) {
        player.shield = true;
    } else if (type === PowerUpType.SPEED_BOOST) {
        this.ballSpeed += 8;
        setTimeout(() => { 
            this.ballSpeed = Math.max(5, this.ballSpeed - 8); 
        }, 5000);
    }
  }
}