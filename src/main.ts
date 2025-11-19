import { navigateTo } from './router.js';
import AppState, { Match } from './state.js';
import PongGame from './PongGame.js';

let currentGame: PongGame | null = null;

function renderDashboard(): void {
    const username = AppState.currentUser ? AppState.currentUser.username : 'Visitante';
    const usernameElement = document.getElementById('dashboard-username');
    if (usernameElement) {
        usernameElement.textContent = username;
    }

    const historyList = document.getElementById('match-history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    if (AppState.matchHistory.length === 0) {
        historyList.innerHTML = '<li>(Nenhuma partida jogada ainda)</li>';
        return;
    }

    AppState.matchHistory.forEach((match: Match) => {
        const li = document.createElement('li');
        li.textContent = `${match.p1} (${match.scoreP1}) - (${match.scoreP2}) ${match.p2}`;
        historyList.appendChild(li);
    });
}

function startGame(): void {
    if (currentGame) {
        currentGame.stopGame();
        currentGame = null;
    }

    const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement | null;
    const player1ScoreElement = document.getElementById('player1Score');
    const player2ScoreElement = document.getElementById('player2Score');

    if (!canvas || !player1ScoreElement || !player2ScoreElement) {
        console.error('Elementos da UI do jogo não encontrados');
        return;
    }

    const gameUI = {
        canvas,
        player1ScoreElement,
        player2ScoreElement,
    };

    currentGame = new PongGame(gameUI, (winnerName, score) => {
        handleGameOver(winnerName, score);
    });

    currentGame.startGame();
}

function handleGameOver(winnerName: string, score: { p1: number; p2: number }): void {
    console.log("Jogo terminou!", winnerName, score);

    AppState.matchHistory.push({
        p1: 'Visitante',
        p2: 'Player 2',
        scoreP1: score.p1,
        scoreP2: score.p2,
    });

    currentGame = null;
    navigateTo('/dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginGuestButton = document.getElementById('loginGuestButton');
    const playGameButton = document.getElementById('playGameButton');
    const quitGameButton = document.getElementById('quitGameButton');

    if (loginGuestButton) {
        loginGuestButton.addEventListener('click', () => {
            AppState.currentUser = { username: 'Visitante' };
            navigateTo('/dashboard');
        });
    }

    if (playGameButton) {
        playGameButton.addEventListener('click', () => {
            navigateTo('/game');
        });
    }

    if (quitGameButton) {
        quitGameButton.addEventListener('click', () => {
            if (currentGame) {
                currentGame.stopGame();
                currentGame = null;
            }
            navigateTo('/dashboard');
        });
    }

    document.addEventListener('routeChange', (e: Event) => {
        const customEvent = e as CustomEvent<{ viewId: string }>;
        const viewId = customEvent.detail.viewId;

        console.log(`Rota mudou para: ${viewId}`);

        if (viewId === 'dashboard-view') {
            renderDashboard();
        }

        if (viewId === 'game-view') {
            startGame();
        }

        if (viewId === 'login-view') {
            AppState.currentUser = null;
            AppState.matchHistory = [];
            if (currentGame) {
                currentGame.stopGame();
                currentGame = null;
            }
        }
    });
});
