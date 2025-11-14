// Lógica de colisão separada
export class CollisionSystem {

	static checkWallCollision(ball, canvasHeight) {
		// Colisão com topo e base
		if (ball.y - ball.radius <= 0) {
			ball.y = ball.radius;
			ball.speedY = Math.abs(ball.speedY);
		} else if (ball.y + ball.radius >= canvasHeight) {
			ball.y = canvasHeight - ball.radius;
			ball.speedY = -Math.abs(ball.speedY);
		}
	}

	static checkPaddleCollision(ball, paddle) {
		// Lógica de detecção de colisão AABB (Axis-Aligned Bounding Box)
		const ballLeft = ball.x - ball.radius;
		const ballRight = ball.x + ball.radius;
		const ballTop = ball.y - ball.radius;
		const ballBottom = ball.y + ball.radius;

		const paddleLeft = paddle.x;
		const paddleRight = paddle.x + paddle.width;
		const paddleTop = paddle.y;
		const paddleBottom = paddle.y + paddle.height;

		// Verifica se há colisão
		if (ballRight >= paddleLeft &&
			ballLeft <= paddleRight &&
			ballBottom >= paddleTop &&
			ballTop <= paddleBottom) {

			// Se colidiu, chama a lógica de rebatida
			this.handlePaddleBounce(ball, paddle);
			return true;
		}

		return false;
	}

	// Versão melhorada da colisão para evitar loops
	static handlePaddleBounce(ball, paddle) {
		ball.speedX = -ball.speedX;

		// Posição normalizada da batida (de -0.5 a 0.5)
		const hitPosition = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);

		// Aleatoriedade (ex: +/- 5 graus)
		const randomness = (Math.random() - 0.5) * (Math.PI / 36);

		// Ângulo máximo maior (72 graus)
		const MAX_BOUNCE_ANGLE = Math.PI / 2.5;
		const angle = hitPosition * MAX_BOUNCE_ANGLE + randomness;

		// Calcula novas velocidades
		const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
		ball.speedX = Math.cos(angle) * speed * Math.sign(ball.speedX);
		ball.speedY = Math.sin(angle) * speed;

		// Garantir velocidade Y mínima para evitar loops
		const MIN_Y_SPEED_RATIO = 0.2;
		const minSpeedY = Math.abs(ball.speedX * MIN_Y_SPEED_RATIO);

		if (Math.abs(ball.speedY) < minSpeedY) {
			ball.speedY = ball.speedY >= 0 ? minSpeedY : -minSpeedY;
		}

		// Ajusta a posição para evitar colisões múltiplas
		if (ball.speedX > 0) {
			ball.x = paddle.x + paddle.width + ball.radius;
		} else {
			ball.x = paddle.x - ball.radius;
		}

		ball.increaseSpeed();
	}

	static checkScore(ball, canvasWidth) {
		if (ball.x - ball.radius <= 0) {
			return 2; // Player 2 pontua
		} else if (ball.x + ball.radius >= canvasWidth) {
			return 1; // Player 1 pontua
		}
		return 0;
	}
}
