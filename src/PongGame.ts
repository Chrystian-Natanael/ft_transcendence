import Ball from './Ball.js';
import Paddle from './Paddle.js';
import AIPaddle from './AIPaddle.js';
import { CollisionSystem } from './CollisionSystem.js';
import * as Config from './constants.js';

interface UIElements {
    canvas: HTMLCanvasElement;
    player1ScoreElement: HTMLElement;
    player2ScoreElement: HTMLElement;
}

interface GameScore {
    p1: number;
    p2: number;
}

type GameOverCallback = (winner: string, score: GameScore) => void;
type GameState = 'IDLE' | 'PLAYING' | 'STOPPED' | 'GAME_OVER';

export default class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ui: UIElements;
    private onGameOverCallback?: GameOverCallback;
    private keys: Record<string, boolean>;
    private state: GameState;
    private animationId: number | null;
    private ball: Ball;
    private paddle1: Paddle;
    private paddle2: Paddle | AIPaddle;
    private keyDownHandler?: (e: KeyboardEvent) => void;
    private keyUpHandler?: (e: KeyboardEvent) => void;

    constructor(uiElements: UIElements, onGameOverCallback?: GameOverCallback) {
        this.canvas = uiElements.canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Não foi possível obter o contexto 2D do canvas');
        }
        this.ctx = ctx;
        this.canvas.width = Config.CANVAS_WIDTH;
        this.canvas.height = Config.CANVAS_HEIGHT;

        this.ui = uiElements;
        this.onGameOverCallback = onGameOverCallback;

        this.keys = {};
        this.state = 'IDLE';
        this.animationId = null;

        this.ball = new Ball(this.canvas.width, this.canvas.height);
        this.paddle1 = new Paddle(Config.PADDLE_PADDING, this.canvas.height);
        this.paddle2 = new AIPaddle(
            this.canvas.width - Config.PADDLE_PADDING - Config.PADDLE_WIDTH,
            this.canvas.height
        );
    }

    startGame(): void {
        console.log("Iniciando o Jogo...");
        this.resetGame();
        this.state = 'PLAYING';
        this.setupEventListeners();
        this.gameLoop();
    }

    stopGame(): void {
        console.log("Parando o Jogo...");
        this.state = 'STOPPED';
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        this.removeEventListeners();
    }

    private setupEventListeners(): void {
        this.keyDownHandler = (e: KeyboardEvent) => this.keys[e.key] = true;
        this.keyUpHandler = (e: KeyboardEvent) => this.keys[e.key] = false;

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    private removeEventListeners(): void {
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
    }

    private resetGame(): void {
        this.paddle1.score = 0;
        this.paddle2.score = 0;
        this.updateScore();
        this.ball.reset();
        this.paddle1.reset();
        this.paddle2.reset();
    }

    private update(): void {
        if (this.keys[Config.P1_UP] || this.keys[Config.P1_UP.toUpperCase()]) {
            this.paddle1.moveUp();
        }
        if (this.keys[Config.P1_DOWN] || this.keys[Config.P1_DOWN.toUpperCase()]) {
            this.paddle1.moveDown();
        }
        if (this.keys[Config.P2_UP]) {
            this.paddle2.moveUp();
        }
        if (this.keys[Config.P2_DOWN]) {
            this.paddle2.moveDown();
        }

        this.paddle1.update();
        if (this.paddle2 instanceof AIPaddle) {
            this.paddle2.update(this.ball);
        } else {
            this.paddle2.update();
        }
        this.ball.update();

        CollisionSystem.checkWallCollision(this.ball, this.canvas.height);
        CollisionSystem.checkPaddleCollision(this.ball, this.paddle1);
        CollisionSystem.checkPaddleCollision(this.ball, this.paddle2);

        const score = CollisionSystem.checkScore(this.ball, this.canvas.width);
        if (score === 1) {
            this.paddle1.score++;
            this.updateScore();
            this.ball.reset();
        } else if (score === 2) {
            this.paddle2.score++;
            this.updateScore();
            this.ball.reset();
        }

        if (this.paddle1.score >= Config.WINNING_SCORE || this.paddle2.score >= Config.WINNING_SCORE) {
            this.gameOver();
        }
    }

    private updateScore(): void {
        this.ui.player1ScoreElement.textContent = this.paddle1.score.toString();
        this.ui.player2ScoreElement.textContent = this.paddle2.score.toString();
    }

    private draw(): void {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 50, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ball.draw(this.ctx);
        this.paddle1.draw(this.ctx);
        this.paddle2.draw(this.ctx);
    }

    private gameOver(): void {
        this.state = 'GAME_OVER';
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        this.removeEventListeners();

        const winner = this.paddle1.score >= Config.WINNING_SCORE ?
            'Player 1' :
            'Player 2';

        const score: GameScore = {
            p1: this.paddle1.score,
            p2: this.paddle2.score
        };

        if (this.onGameOverCallback) {
            this.onGameOverCallback(winner, score);
        }
    }

    private gameLoop = (): void => {
        if (this.state !== 'PLAYING') {
            if (this.animationId !== null) {
                cancelAnimationFrame(this.animationId);
            }
            return;
        }

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(this.gameLoop);
    }
}
