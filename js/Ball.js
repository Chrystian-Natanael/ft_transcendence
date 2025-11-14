import { BALL_RADIUS, BALL_BASE_SPEED } from './constants.js';

export default class Ball {
	constructor(canvasWidth, canvasHeight) {
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.radius = BALL_RADIUS;
		this.baseSpeed = BALL_BASE_SPEED;
		this.reset();
	}

	reset() {
		this.x = this.canvasWidth / 2;
		this.y = this.canvasHeight / 2;
		this.speedX = (Math.random() > 0.5 ? 1 : -1) * this.baseSpeed;
		this.speedY = (Math.random() - 0.5) * this.baseSpeed;

		if (Math.abs(this.speedY) < 1) {
			this.speedY = this.speedY > 0 ? 1 : -1;
		}
	}

	update() {
		this.x += this.speedX;
		this.y += this.speedY;
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.closePath();
	}

	increaseSpeed() {
		// Aumenta a velocidade, mas com um limite
		if (Math.abs(this.speedX) < this.baseSpeed * 3) {
			this.speedX *= 1.02;
			this.speedY *= 1.02;
		}
	}
}
