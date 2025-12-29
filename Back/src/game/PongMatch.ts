import { Server } from 'socket.io';
import { GameState, PlayerSkin, PowerUpType } from '../types/game';
import { db } from '../database/memoryDB';

// Constantes
const FPS = 60;
const TICK_RATE = 1000 / FPS;
const PADDLE_SPEED = 10;
const MAX_SPEED = 25; 
const DEFAULT_PADDLE_HEIGHT = 130;
const BALL_RADIUS = 10;
const WIN_SCORE = 5;

const POINTS_WIN = 20;
const POINTS_LOSE = 10;

export interface PlayerData {
    id: number;
    socketId: string;
    nick: string;
    avatar: string;
    gameAvatar: string;
    skin: string;
}

export class PongMatch {
  private io: Server;
  private state: GameState;
  private roomId: string;
  private isRanked: boolean;

  private p1UserId: number;
  private p2UserId: number;
  
  // Propriedades Públicas para acesso no Server.ts
  public p1SocketId: string;
  public p2SocketId: string;
  
  private intervalId: NodeJS.Timeout | null = null;
  private powerUpTimeout: NodeJS.Timeout | null = null;
  private isGameRunning: boolean = false;
  
  private lastHitterId: string | null = null;
  
  private p1MoveDir: number = 0;
  private p2MoveDir: number = 0;

  // Velocidades individuais (para o PowerUp)
  private p1CurrentSpeed: number = PADDLE_SPEED;
  private p2CurrentSpeed: number = PADDLE_SPEED;

  private isBallMoving: boolean = false;
  private ballSpeed: number = 5; 
  private ballDir = { x: 0, y: 0 };
  
  constructor(io: Server, roomId: string, p1Data: PlayerData, p2Data: PlayerData, isRanked: boolean = false) {
    this.io = io;
    this.roomId = roomId;
    this.isRanked = isRanked;
    
    // Inicializa IDs públicos
    this.p1SocketId = p1Data.socketId;
    this.p2SocketId = p2Data.socketId;

    this.p1UserId = p1Data.id;
    this.p2UserId = p2Data.id;

    this.state = {
      tableWidth: 800,
      tableHeight: 600,
      ball: { x: 400, y: 300 },
      
      player1: { 
          id: p1Data.socketId, 
          y: 250, 
          score: 0, 
          height: DEFAULT_PADDLE_HEIGHT, 
          shield: false, 
          nick: p1Data.nick,
          avatar: p1Data.avatar,
          gameAvatar: p1Data.gameAvatar,
          skin: p1Data.skin as PlayerSkin
      },
      
      player2: { 
          id: p2Data.socketId, 
          y: 250, 
          score: 0, 
          height: DEFAULT_PADDLE_HEIGHT, 
          shield: false, 
          nick: p2Data.nick,
          avatar: p2Data.avatar,
          gameAvatar: p2Data.gameAvatar,
          skin: p2Data.skin as PlayerSkin
      },
      
      powerUp: null
    };

    this.setupSocketListeners();
    this.isGameRunning = true;
    this.startGameLoop();
    this.startRoundTimer();
  }

  private setupSocketListeners() {
    const p1Socket = this.io.sockets.sockets.get(this.state.player1.id);
    const p2Socket = this.io.sockets.sockets.get(this.state.player2.id);

    if (p1Socket) {
      p1Socket.on('movePaddle', (data) => this.updatePaddleDirection(1, data.direction));
    }
    if (p2Socket) {
      p2Socket.on('movePaddle', (data) => this.updatePaddleDirection(2, data.direction));
    }
  }

  private updatePaddleDirection(playerNum: 1 | 2, direction: 'UP' | 'DOWN' | 'STOP') {
    const dirValue = direction === 'UP' ? -1 : (direction === 'DOWN' ? 1 : 0);
    if (playerNum === 1) this.p1MoveDir = dirValue;
    else this.p2MoveDir = dirValue;
  }

  private startRoundTimer() {
    if (!this.isGameRunning) return;

    this.isBallMoving = false;
    this.lastHitterId = null;
    this.state.ball = { x: 400, y: 300 };
    
    // Reseta velocidades
    this.ballSpeed = 5; 
    this.ballDir = { x: 0, y: 0 };
    this.p1CurrentSpeed = PADDLE_SPEED;
    this.p2CurrentSpeed = PADDLE_SPEED;

    let countdown = 3;

    const timer = setInterval(() => {
        if (!this.isGameRunning) {
            clearInterval(timer);
            return;
        }

        this.io.to(this.roomId).emit('matchStatus', `starting:${countdown}`);
        if (countdown <= 0) {
            clearInterval(timer);
            this.startBall();
        }
        countdown--;
    }, 1000);
  }

  private startBall() {
    if (!this.isGameRunning) return;

    this.isBallMoving = true;
    this.io.to(this.roomId).emit('matchStatus', 'playing');
    
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); 
    
    this.ballDir = { 
        x: dirX * Math.cos(angle), 
        y: Math.sin(angle) 
    };
    
    this.startPowerUpSpawner(); 
  }

  private startGameLoop() {
    this.intervalId = setInterval(() => {
      if (!this.isGameRunning) {
          if (this.intervalId) clearInterval(this.intervalId);
          return;
      }

      this.updatePaddles();

      if (this.isBallMoving) {
          if (this.ballSpeed < MAX_SPEED) {
              this.ballSpeed += 0.005; 
          }

          this.updateBallPhysics();
          this.checkCollisions();
          
          if (this.isBallMoving) {
              this.checkGoal();
          }
      }
      
      this.io.to(this.roomId).emit('gameState', this.state);
    }, TICK_RATE);
  }

  private updatePaddles() {
    const p1 = this.state.player1;
    const p2 = this.state.player2;

    if (this.p1MoveDir !== 0) {
        p1.y += this.p1MoveDir * this.p1CurrentSpeed;
        p1.y = Math.max(0, Math.min(this.state.tableHeight - p1.height, p1.y));
    }
    if (this.p2MoveDir !== 0) {
        p2.y += this.p2MoveDir * this.p2CurrentSpeed;
        p2.y = Math.max(0, Math.min(this.state.tableHeight - p2.height, p2.y));
    }
  }

  private updateBallPhysics() {
    this.state.ball.x += this.ballDir.x * this.ballSpeed;
    this.state.ball.y += this.ballDir.y * this.ballSpeed;

    // Colisão Teto/Chão (Correção de bug de grudar)
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
    const p2 = this.state.player2;

    // Colisão P1 (Esquerda)
    if (ball.x - BALL_RADIUS <= 20 && ball.x + BALL_RADIUS >= 10) {
        if (ball.y + BALL_RADIUS >= p1.y && ball.y - BALL_RADIUS <= p1.y + p1.height) {
            this.handlePaddleHit(p1, 1);
        }
    }
    // ESCUDO P1: Checa se tem escudo E se a bola está na zona de perigo (mas não passou totalmente)
    else if (p1.shield && ball.x - BALL_RADIUS <= 15 && ball.x > -10) {
       this.ballDir.x = Math.abs(this.ballDir.x); // Rebate para direita
       p1.shield = false; // Gasta escudo
       this.lastHitterId = p1.id;
    }

    // Colisão P2 (Direita)
    const p2X = this.state.tableWidth - 20;
    if (ball.x + BALL_RADIUS >= p2X && ball.x - BALL_RADIUS <= p2X + 10) {
        if (ball.y + BALL_RADIUS >= p2.y && ball.y - BALL_RADIUS <= p2.y + p2.height) {
            this.handlePaddleHit(p2, -1);
        }
    }
    // ESCUDO P2
    else if (p2.shield && ball.x + BALL_RADIUS >= this.state.tableWidth - 15 && ball.x < this.state.tableWidth + 10) {
       this.ballDir.x = -Math.abs(this.ballDir.x); // Rebate para esquerda
       p2.shield = false; // Gasta escudo
       this.lastHitterId = p2.id;
    }
    
    // PowerUp
    if (this.state.powerUp && this.state.powerUp.active) {
       const dist = Math.hypot(this.state.ball.x - this.state.powerUp.x, this.state.ball.y - this.state.powerUp.y);
       if (dist < 30) {
          const owner = this.lastHitterId === this.state.player1.id ? this.state.player1 : this.state.player2;
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
    if (this.state.ball.x < -20) this.handleScore('player2');
    else if (this.state.ball.x > this.state.tableWidth + 20) this.handleScore('player1');
  }

  private handleScore(scorer: 'player1' | 'player2') {
    this.isBallMoving = false;

    if (scorer === 'player1') this.state.player1.score++;
    else this.state.player2.score++;

    this.io.to(this.roomId).emit('scoreUpdate', { scorer });

    if (this.state.player1.score >= WIN_SCORE || this.state.player2.score >= WIN_SCORE) {
        this.endMatch(this.state.player1.score >= WIN_SCORE ? this.state.player1.id : this.state.player2.id);
    } else {
        this.startRoundTimer();
    }
  }

  private startPowerUpSpawner() {
    if (this.powerUpTimeout) clearTimeout(this.powerUpTimeout);
    if(!this.isBallMoving || !this.isGameRunning) return;
    const randomTime = Math.random() * (10000 - 5000) + 5000;
    this.powerUpTimeout = setTimeout(() => {
        if (!this.state.powerUp && this.isBallMoving && this.isGameRunning) this.spawnPowerUp();
        if (this.isBallMoving && this.isGameRunning) this.startPowerUpSpawner();
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
    } 
    else if (type === PowerUpType.SHIELD) {
        player.shield = true;
    } 
    else if (type === PowerUpType.SPEED_BOOST) {
        const isP1 = player.id === this.state.player1.id;
        if (isP1) this.p1CurrentSpeed = PADDLE_SPEED * 1.5;
        else this.p2CurrentSpeed = PADDLE_SPEED * 1.5;

        setTimeout(() => { 
            if (isP1) this.p1CurrentSpeed = PADDLE_SPEED;
            else this.p2CurrentSpeed = PADDLE_SPEED;
        }, 5000);
    }
  }

  // --- Método Público para o Servidor Chamar ---
public handleDisconnection(socketId: string) {
      if (!this.isGameRunning) return;

      let winnerSocketId = '';
      let message = '';

      if (socketId === this.p1SocketId) {
          winnerSocketId = this.state.player2.id;
          message = 'Oponente desconectou. Você venceu!';
      } 
      else if (socketId === this.p2SocketId) {
          winnerSocketId = this.state.player1.id;
          message = 'Oponente desconectou. Você venceu!';
      }

      if (winnerSocketId) {
          this.endMatch(winnerSocketId, message);
      }

      
  }

  private endMatch(winnerSocketId: string, customMessage?: string) {
    this.isGameRunning = false;
    this.isBallMoving = false;

    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.powerUpTimeout) { clearTimeout(this.powerUpTimeout); }

    const p1Socket = this.io.sockets.sockets.get(this.state.player1.id);
    const p2Socket = this.io.sockets.sockets.get(this.state.player2.id);
    if (p1Socket) p1Socket.removeAllListeners('movePaddle');
    if (p2Socket) p2Socket.removeAllListeners('movePaddle');

    // --- LÓGICA DE PONTOS (RANKED) ---
    if (this.isRanked) {
        this.processRankedPoints(winnerSocketId);
    }

    const defaultMsg = winnerSocketId === this.state.player1.id ? 'Player 1 Wins!' : 'Player 2 Wins!';

    this.io.to(this.roomId).emit('gameOver', {
        winnerId: winnerSocketId,
        message: customMessage || defaultMsg
    });
  }

  private async processRankedPoints(winnerSocketId: string) {
      const isP1Winner = winnerSocketId === this.p1SocketId;
      
      const winnerId = isP1Winner ? this.p1UserId : this.p2UserId;
      const loserId = isP1Winner ? this.p2UserId : this.p1UserId;

      const winnerUser = await db.findUserById(winnerId);
      const loserUser = await db.findUserById(loserId);

      if (winnerUser && loserUser) {
          winnerUser.score = (winnerUser.score || 0) + POINTS_WIN;
          loserUser.score = Math.max(0, (loserUser.score || 0) - POINTS_LOSE);

          console.log(`[RANKED] ${winnerUser.nick} (+${POINTS_WIN}) vs ${loserUser.nick} (-${POINTS_LOSE})`);
          
          // Num banco SQL, aqui você faria: await db.updateScore(winnerId, newScore);
      }
  }
}