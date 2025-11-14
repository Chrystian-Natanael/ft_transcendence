import Paddle from './Paddle.js';

export default class AIPaddle extends Paddle {
	constructor(x, canvasHeight) {
		// 'super' chama o construtor da classe 'pai' (Paddle)
		super(x, canvasHeight);
	}

	// Sobrescrevemos o método update para adicionar a lógica da IA
	update(ball) {
		this.aiMove(ball);

		// Chamamos o 'update' da classe pai para manter a verificação de limites
		super.update();
	}

	aiMove(ball) {
		const paddleCenter = this.y + this.height / 2;
		const ballCenter = ball.y;

		// Nível de "erro" ou "lentidão" da IA
		if (Math.random() < 0.02) return;

		const error = (Math.random() - 0.5) * 20;
		const targetY = ballCenter + error - this.height / 2;

		// Move a IA de forma mais suave (70% da velocidade)
		if (targetY > this.y) {
			this.y += Math.min(this.speed * 0.7, targetY - this.y);
		} else if (targetY < this.y) {
			this.y -= Math.min(this.speed * 0.7, this.y - targetY);
		}
	}

	// Sobrescrevemos 'draw' para mudar a cor
	draw(ctx) {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(this.x, this.y, this.width, this.height);

		// Efeito visual (IA)
		ctx.fillStyle = '#ff4444';
		ctx.fillRect(this.x, this.y + this.height / 2 - 10, this.width, 20);
	}
}
