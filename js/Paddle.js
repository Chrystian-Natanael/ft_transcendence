import { PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED } from './constants.js';

export default class Paddle {
	constructor(x, canvasHeight) {
		this.width = PADDLE_WIDTH;
		this.height = PADDLE_HEIGHT;
		this.x = x;
		this.y = canvasHeight / 2 - this.height / 2;
		this.speed = PADDLE_SPEED;
		this.score = 0;
		this.canvasHeight = canvasHeight;
	}

	update() {
		// Mantém a raquete nos limites da tela
		if (this.y < 0) this.y = 0;
		if (this.y + this.height > this.canvasHeight) {
			this.y = this.canvasHeight - this.height;
		}
	}

	moveUp() {
		this.y -= this.speed;
	}

	moveDown() {
		this.y += this.speed;
	}

	draw(ctx) {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(this.x, this.y, this.width, this.height);

		// Efeito visual (Player)
		ctx.fillStyle = '#4444ff';
		ctx.fillRect(this.x, this.y + this.height / 2 - 10, this.width, 20);
	}

	reset() {
		this.y = this.canvasHeight / 2 - this.height / 2;
	}
}
