import Paddle from './Paddle.js';
import Ball from './Ball.js';

export default class AIPaddle extends Paddle {
    constructor(x: number, canvasHeight: number) {
        super(x, canvasHeight);
    }

    update(ball?: Ball): void {
        if (ball) {
            this.aiMove(ball);
        }
        super.update();
    }

    private aiMove(ball: Ball): void {
        const paddleCenter = this.y + this.height / 2;
        const ballCenter = ball.y;

        if (Math.random() < 0.02) return;

        const error = (Math.random() - 0.5) * 20;
        const targetY = ballCenter + error - this.height / 2;

        if (targetY > this.y) {
            this.y += Math.min(this.speed * 0.7, targetY - this.y);
        } else if (targetY < this.y) {
            this.y -= Math.min(this.speed * 0.7, this.y - targetY);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y + this.height / 2 - 10, this.width, 20);
    }
}
