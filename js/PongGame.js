import Ball from './Ball.js';
import Paddle from './Paddle.js';
import AIPaddle from './AIPaddle.js';
import { CollisionSystem } from './CollisionSystem.js';
import * as Config from './constants.js';

export default class PongGame {

	// O construtor agora aceita um "callback" (uma função)
	// que será chamado quando o jogo terminar.
	constructor(uiElements, onGameOverCallback) {
		// --- Configuração da UI e Canvas ---
		this.canvas = uiElements.canvas;
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = Config.CANVAS_WIDTH;
		this.canvas.height = Config.CANVAS_HEIGHT;

		// Elementos da UI (placar)
		this.ui = uiElements;

		// Salva a função de callback para ser usada depois
		this.onGameOverCallback = onGameOverCallback;

		// --- Estado do Jogo ---
		this.keys = {};
		this.state = 'IDLE'; // Estado inicial (ocioso)
		this.animationId = null; // ID para parar o requestAnimationFrame

		// --- Objetos do Jogo ---
		this.ball = new Ball(this.canvas.width, this.canvas.height);
		this.paddle1 = new Paddle(Config.PADDLE_PADDING, this.canvas.height);

		// Altere esta linha para new AIPaddle(...) para jogar contra a IA
		this.paddle2 = new AIPaddle(this.canvas.width - Config.PADDLE_PADDING - Config.PADDLE_WIDTH, this.canvas.height);
	}

	// --- Métodos de Controle ---

	// Este método é chamado pelo main.js para iniciar o jogo
	startGame() {
		console.log("Iniciando o Jogo...");
		this.resetGame();
		this.state = 'PLAYING';
		this.setupEventListeners(); // Configura os controles
		this.gameLoop(); // Inicia o loop
	}

	// Este método é chamado pelo main.js se o usuário
	// clicar em "Sair" no meio da partida.
	stopGame() {
		console.log("Parando o Jogo...");
		this.state = 'STOPPED';
		cancelAnimationFrame(this.animationId); // Para o loop
		this.removeEventListeners(); // Remove os controles
	}

	// --- Configuração de Eventos ---

	// Precisamos guardar as referências das funções
	// para que possamos removê-las depois.
	setupEventListeners() {
		this.keyDownHandler = (e) => this.keys[e.key] = true;
		this.keyUpHandler = (e) => this.keys[e.key] = false;

		document.addEventListener('keydown', this.keyDownHandler);
		document.addEventListener('keyup', this.keyUpHandler);
	}

	// Função para remover os listeners e evitar "input fantasma"
	removeEventListeners() {
		document.removeEventListener('keydown', this.keyDownHandler);
		document.removeEventListener('keyup', this.keyUpHandler);
	}

	// --- Lógica Principal do Jogo ---

	resetGame() {
		this.paddle1.score = 0;
		this.paddle2.score = 0;
		this.updateScore();
		this.ball.reset(this.canvas.width, this.canvas.height);
		this.paddle1.reset(this.canvas.height);
		this.paddle2.reset(this.canvas.height);
	}

	update() {
		// Movimenta as raquetes
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

		// Atualiza posições
		this.paddle1.update();
		this.paddle2.update(this.ball); // O 'ball' só é usado se for AIPaddle
		this.ball.update();

		// Colisões
		CollisionSystem.checkWallCollision(this.ball, this.canvas.height);
		CollisionSystem.checkPaddleCollision(this.ball, this.paddle1);
		CollisionSystem.checkPaddleCollision(this.ball, this.paddle2);

		// Pontuação
		const score = CollisionSystem.checkScore(this.ball, this.canvas.width);
		if (score === 1) {
			this.paddle1.score++;
			this.updateScore();
			this.ball.reset(this.canvas.width, this.canvas.height);
		} else if (score === 2) {
			this.paddle2.score++;
			this.updateScore();
			this.ball.reset(this.canvas.width, this.canvas.height);
		}

		// Fim de jogo
		if (this.paddle1.score >= Config.WINNING_SCORE || this.paddle2.score >= Config.WINNING_SCORE) {
			this.gameOver();
		}
	}

	updateScore() {
		this.ui.player1ScoreElement.textContent = this.paddle1.score.toString();
		this.ui.player2ScoreElement.textContent = this.paddle2.score.toString();
	}

	draw() {
		// Limpa e desenha o fundo
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Linha e círculo central
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

		// Objetos
		this.ball.draw(this.ctx);
		this.paddle1.draw(this.ctx);
		this.paddle2.draw(this.ctx);
	}

	// O jogo não dá mais 'alert()' nem mostra o menu.
	// Ele chama o 'callback' que o main.js forneceu.
	gameOver() {
		this.state = 'GAME_OVER';
		cancelAnimationFrame(this.animationId); // Para o loop
		this.removeEventListeners(); // Remove os controles

		// Determina o vencedor
		const winner = this.paddle1.score >= Config.WINNING_SCORE ?
			'Player 1' :
			'Player 2';

		// Cria um objeto com o placar final
		const score = {
			p1: this.paddle1.score,
			p2: this.paddle2.score
		};

		// Chama a função 'onGameOverCallback' que o main.js nos passou
		if (this.onGameOverCallback) {
			this.onGameOverCallback(winner, score);
		}
	}

	// O gameLoop agora verifica o 'state'
	gameLoop = () => {
		// Se o estado não for 'PLAYING', o loop para
		if (this.state !== 'PLAYING') {
			cancelAnimationFrame(this.animationId);
			return;
		}

		this.update();
		this.draw();

		// Continua o loop
		this.animationId = requestAnimationFrame(this.gameLoop);
	}
}
