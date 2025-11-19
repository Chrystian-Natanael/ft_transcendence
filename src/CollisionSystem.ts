import Ball from './Ball.js';
import Paddle from './Paddle.js';

export class CollisionSystem {
    static checkWallCollision(ball: Ball, canvasHeight: number): void {
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.speedY = Math.abs(ball.speedY);
        } else if (ball.y + ball.radius >= canvasHeight) {
            ball.y = canvasHeight - ball.radius;
            ball.speedY = -Math.abs(ball.speedY);
        }
    }

    static checkPaddleCollision(ball: Ball, paddle: Paddle): boolean {
        const ballLeft = ball.x - ball.radius;
        const ballRight = ball.x + ball.radius;
        const ballTop = ball.y - ball.radius;
        const ballBottom = ball.y + ball.radius;

        const paddleLeft = paddle.x;
        const paddleRight = paddle.x + paddle.width;
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + paddle.height;

        if (ballRight >= paddleLeft &&
            ballLeft <= paddleRight &&
            ballBottom >= paddleTop &&
            ballTop <= paddleBottom) {

            this.handlePaddleBounce(ball, paddle);
            return true;
        }

        return false;
    }

    private static handlePaddleBounce(ball: Ball, paddle: Paddle): void {
        ball.speedX = -ball.speedX;

        const hitPosition = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        const randomness = (Math.random() - 0.5) * (Math.PI / 36);
        const MAX_BOUNCE_ANGLE = Math.PI / 2.5;
        const angle = hitPosition * MAX_BOUNCE_ANGLE + randomness;

        const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        ball.speedX = Math.cos(angle) * speed * Math.sign(ball.speedX);
        ball.speedY = Math.sin(angle) * speed;

        const MIN_Y_SPEED_RATIO = 0.2;
        const minSpeedY = Math.abs(ball.speedX * MIN_Y_SPEED_RATIO);

        if (Math.abs(ball.speedY) < minSpeedY) {
            ball.speedY = ball.speedY >= 0 ? minSpeedY : -minSpeedY;
        }

        if (ball.speedX > 0) {
            ball.x = paddle.x + paddle.width + ball.radius;
        } else {
            ball.x = paddle.x - ball.radius;
        }

        ball.increaseSpeed();
    }

    static checkScore(ball: Ball, canvasWidth: number): number {
        if (ball.x - ball.radius <= 0) {
            return 2;
        } else if (ball.x + ball.radius >= canvasWidth) {
            return 1;
        }
        return 0;
    }
}
