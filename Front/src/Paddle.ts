import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED } from './constants.js';

export default class Paddle {
    public x: number;
    public y: number;
    public score: number;
    public readonly width: number;
    public readonly height: number;
    public readonly speed: number;
    protected canvasHeight: number;

    constructor(x: number, canvasHeight: number) {
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.x = x;
        this.y = canvasHeight / 2 - this.height / 2;
        this.speed = PADDLE_SPEED;
        this.score = 0;
        this.canvasHeight = canvasHeight;
    }

    update(): void {
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.canvasHeight) {
            this.y = this.canvasHeight - this.height;
        }
    }

    moveUp(): void {
        this.y -= this.speed;
    }

    moveDown(): void {
        this.y += this.speed;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#4444ff';
        ctx.fillRect(this.x, this.y + this.height / 2 - 10, this.width, 20);
    }

    reset(): void {
        this.y = this.canvasHeight / 2 - this.height / 2;
    }
}
