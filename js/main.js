import { navigateTo } from './router.js';
import AppState from './state.js';
import PongGame from './PongGame.js'; // Importa a classe do jogo

let currentGame = null;

// --- Funções de Lógica ---

function renderDashboard() {
	// Atualiza o nome de usuário (mesmo que seja só "Visitante")
	const username = AppState.currentUser ? AppState.currentUser.username : 'Visitante';
	document.getElementById('dashboard-username').textContent = username;

	// Renderiza o histórico de partidas
	const historyList = document.getElementById('match-history-list');
	historyList.innerHTML = ''; // Limpa a lista

	if (AppState.matchHistory.length === 0) {
		historyList.innerHTML = '<li>(Nenhuma partida jogada ainda)</li>';
		return;
	}

	AppState.matchHistory.forEach(match => {
		const li = document.createElement('li');
		li.textContent = `${match.p1} (${match.scoreP1}) - (${match.scoreP2}) ${match.p2}`;
		historyList.appendChild(li);
	});
}

function startGame() {
	// Se já existe um jogo, pare-o antes de começar um novo
	if (currentGame) {
		currentGame.stopGame();
		currentGame = null;
	}

	// Coleta os elementos da UI do jogo
	const gameUI = {
		canvas: document.getElementById('pongCanvas'),
		player1ScoreElement: document.getElementById('player1Score'),
		player2ScoreElement: document.getElementById('player2Score'),
		// PongGame não precisa mais saber do menu de login
	};

	// Cria a instância do jogo, passando o callback de 'gameOver'
	currentGame = new PongGame(gameUI, (winnerName, score) => {
		// Este é o callback que o PongGame irá chamar
		handleGameOver(winnerName, score);
	});

	// Inicia o jogo
	currentGame.startGame();
}

function handleGameOver(winnerName, score) {
	console.log("Jogo terminou!", winnerName, score);

	// 1. Adiciona a partida ao histórico (no Estado)
	AppState.matchHistory.push({
		p1: 'Visitante', // Ou o nome do usuário logado
		p2: 'Player 2', // Ou 'IA'
		scoreP1: score.p1,
		scoreP2: score.p2,
	});

	// 2. Limpa a instância do jogo
	currentGame = null;

	// 3. Navega de volta ao dashboard
	navigateTo('/dashboard');
}

// --- Ponto de Entrada da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {

	// Configura os botões que NAVEGAM
	document.getElementById('loginGuestButton').addEventListener('click', () => {
		AppState.currentUser = { username: 'Visitante' };
		navigateTo('/dashboard');
	});

	document.getElementById('playGameButton').addEventListener('click', () => {
		navigateTo('/game');
	});

	document.getElementById('quitGameButton').addEventListener('click', () => {
		if (currentGame) {
			currentGame.stopGame(); // Você PRECISA ter esse método em PongGame
			currentGame = null;
		}
		navigateTo('/dashboard');
	});

	// Ouve as mudanças de rota e reage a elas
	document.addEventListener('routeChange', (e) => {
		const viewId = e.detail.viewId;

		console.log(`Rota mudou para: ${viewId}`);

		if (viewId === 'dashboard-view') {
			renderDashboard();
		}

		if (viewId === 'game-view') {
			startGame();
		}

		if (viewId === 'login-view') {
			// Se o usuário voltar ao login, limpa o estado
			AppState.currentUser = null;
			AppState.matchHistory = [];
			if (currentGame) {
				currentGame.stopGame();
				currentGame = null;
			}
		}
	});
});
