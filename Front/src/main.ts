import PongGame from './PongGame.js';
import { navigateTo } from './router.js';
import AppState, { Match } from './state.js';

let currentGame: PongGame | null = null;


const avatarImage = document.getElementById("profile-avatar-wrapper") as HTMLDivElement;
const photoInput = document.getElementById("profile-photo-input") as HTMLInputElement;
const avatar = document.getElementById("profile-avatar") as HTMLImageElement;

avatarImage?.addEventListener("click", () => {
	photoInput.click();
});

photoInput?.addEventListener("change", () => {
	const file = photoInput.files?.[0];
	if (!file) return;

	avatar.src = URL.createObjectURL(file);
});

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


function showRegisterError(message: string, inputId?: string) {
	const errorMsg = document.getElementById("register-error-msg")!;
	errorMsg.textContent = message;
	errorMsg.classList.remove("hidden");

	document.querySelectorAll(".input-field").forEach((el) => {
		el.classList.remove("input-error");
	});

	if (inputId) {
		const field = document.getElementById(inputId);
		field?.classList.add("input-error");
		field?.scrollIntoView({ behavior: "smooth", block: "center" });
	}
}

function setupTournamentTabs() {
    const tabCreate = document.getElementById('tab-create');
    const tabJoin = document.getElementById('tab-join');

    const contentCreate = document.getElementById('content-create');
    const contentJoin = document.getElementById('content-join');

    if (!tabCreate || !tabJoin || !contentCreate || !contentJoin) {
        console.warn("Tournament tabs: elementos não encontrados.");
        return;
    }

    tabCreate.addEventListener("click", () => {
        contentCreate.classList.remove("hidden");
        contentJoin.classList.add("hidden");

        tabCreate.classList.add("active");
        tabJoin.classList.remove("active");
    });

    tabJoin.addEventListener("click", () => {
        contentJoin.classList.remove("hidden");
        contentCreate.classList.add("hidden");

        tabJoin.classList.add("active");
        tabCreate.classList.remove("active");
    });
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

async function handleAnonymousLogin(): Promise<void> {
    const guestNameInput = document.getElementById('guest-name-input') as HTMLInputElement;
    const nick = guestNameInput?.value?.trim();

    if (!nick) {
        // Colocar vermelho
        return ;
    }

    try {
        const response = await fetch('http://localhost:3333/auth/anonymous', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nick }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Erro ao criar conta anônima');
            // Colocar vermelho
            return ;
        }

        localStorage.setItem('token', data.token);
        AppState.currentUser = { username: data.user.nick, gang: data.user.gang };

        navigateTo('/dashboard');

    } catch (error) {
        console.error('Erro ao fazer login anônimo:', error);
    }

}


async function handleRegister(): Promise<void> {
    const NameInput = document.getElementById('register-name-input') as HTMLInputElement;
    const NickInput = document.getElementById('register-login-input') as HTMLInputElement;
    const EmailInput = document.getElementById('register-email-input') as HTMLInputElement;
    const PasswordInput = document.getElementById('register-password-input') as HTMLInputElement;
    const GangInput = document.getElementById('register-gang-select') as HTMLInputElement;

    const name = NameInput?.value?.trim();
    const nick = NickInput?.value?.trim();
    const email = EmailInput?.value?.trim();
    const password = PasswordInput?.value;
    const gang = GangInput?.value;

    if (!nick || !name || !email || !password || !gang) {
        // Colocar vermelho
        return ;
    }

    try {
        const response = await fetch('http://localhost:3333/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "name": name,
                "nick": nick,
                "email": email,
                "password": password,
                "gang": gang
             }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Erro ao criar conta');
            // Colocar vermelho
            return ;
        }

        navigateTo('/');

    } catch (error) {
        console.error('Erro ao criar a conta:', error);
    }

}


async function handleLogin(): Promise<void> {
    const IdentifierInput = document.getElementById('login-username-input') as HTMLInputElement;
    const PasswordInput = document.getElementById('login-password-input') as HTMLInputElement;
   

    const identifier = IdentifierInput?.value?.trim();
    const password = PasswordInput?.value;


    console.log("Deu ruim");
    if (!identifier || !password) {
        // Colocar vermelho
        return ;
    }

    try {
        const response = await fetch('http://localhost:3333/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "identifier": identifier,
                "password": password,
             }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Erro ao tentar entrar na conta');
            // Colocar vermelho
            return ;
        }

        localStorage.setItem('token', data.token);
        AppState.currentUser = { username: data.user.nick, gang: data.user.gang };

        navigateTo('/dashboard');

    } catch (error) {
        console.error('Erro ao tentar entrar na conta:', error);
    }

}


document.addEventListener('DOMContentLoaded', () => {
    const loginGuestButton = document.getElementById('loginGuestButton');
    const playGameButton = document.getElementById('playGameButton');
    const quitGameButton = document.getElementById('quitGameButton');
    const backToDashboardButton = document.getElementById('backToDashboardButton');
    const registerButton = document.getElementById('registerSubmitButton');
    const loginButton = document.getElementById('loginButton');

    if (loginButton){
        loginButton?.addEventListener('click', handleLogin);
    }

    if (registerButton) {
        registerButton.addEventListener('click', handleRegister);
    }

    if (loginGuestButton) {
        loginGuestButton.addEventListener('click', handleAnonymousLogin);
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

    if (backToDashboardButton) {
        backToDashboardButton.addEventListener('click', () => {
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

window.addEventListener("DOMContentLoaded", () => {
    setupTournamentTabs();
});
