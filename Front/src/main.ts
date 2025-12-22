import './style.css';
import { showModal } from './utils/modalManager';
import { getDashboardHtml } from './views/dashboard';
import { getFriendsHtml } from './views/friends';
import { getRankingHtml } from './views/ranking';
import { get2FAHtml } from './views/twofa';

import { authService } from './services/authRoutes';
import { getLoginHtml } from './views/login';
import { getProfileHtml } from './views/profile';
import { getRegisterHtml, updateRegisterBg } from './views/register';
import { getSettingsHtml } from './views/settings';
import { get2FADisableHtml } from './views/twofaDisable';

type Route = 'login' | 'register' | '2fa' | '2fa-disable' | 'dashboard' | 'game' | 'profile' | 'friends' | 'leaderboard' | 'settings';

export interface User {
	id: number;
	name: string;
	nick: string;
	avatar?: string;
	isAnonymous: boolean;
	score: number;
	rank: number;
	isOnline: boolean;
	gang: 'potatoes' | 'tomatoes'
	has2FA: boolean;
}

interface State {
	user: User | null;
	isAuthenticated: boolean;
}

const savedState = localStorage.getItem('appState');

export const state: State = {
	user: savedState ? JSON.parse(savedState).user : null,
	isAuthenticated: savedState ? true : false,
}

const app = document.querySelector<HTMLDivElement>('#app')!;

function navigateTo(route: Route, addToHistory = true) {
	if (route === 'dashboard' || route === 'profile' || route == 'game') {
		if (!state.isAuthenticated) {
			navigateTo('login');
			return ;
		}
	}

	if (route === 'login' || route === 'register') {
		if (state.isAuthenticated) {
			navigateTo('dashboard', false);
			return ;
		}
	}

	if (addToHistory) {
		history.pushState({ route }, '', `#${route}`);
	}

	// window.location.pathname = "";
	window.location.hash = `#${route}`;

	renderView(route);
}

function renderView(route: Route) {
	switch (route) {
		case 'login':
			if (state.isAuthenticated) {
				navigateTo('dashboard', false);
				return;
			}

			app.innerHTML = getLoginHtml();
			setupLoginEvents();
			break;

		case 'register':
			if (state.isAuthenticated) {
				navigateTo('dashboard', false);
				return;
			}
			app.innerHTML = getRegisterHtml();
			setupRegisterEvents();
			break;

		case '2fa':
			app.innerHTML = get2FAHtml({
				qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/demo',
				secret: 'ABCD-EFGH-IJKL'
			});
			setup2FAEvents();
			break;

/* 		case '2fa':
			if (!state.isAuthenticated) {
				navigateTo('login', false);
				return;
			}
			app.innerHTML = get2FAHtml();
			setup2faEvents();
			break; */

		case '2fa-disable':
			app.innerHTML = get2FADisableHtml();
			setup2FADisableEvents();
			break;

		case 'dashboard':
			app.innerHTML = getDashboardHtml();
			setupDashboardEvents();
			break;

// 		case 'game':
// 			app.innerHTML = getGameHtml();
// 			setupGameEvents();
// 			break;

		case 'profile':
			if (state.user && state.user.isAnonymous) {
				navigateTo("dashboard", false);
				showModal({
					title: "Acesso Negado",
					message: "Usuários anônimos não podem acessar o perfil. Por favor, crie uma conta para personalizar seu perfil.",
					type: "danger",
					confirmText: "Voltar ao Menu"
				});
				return;
			}

			app.innerHTML = getProfileHtml();
			setupProfileEvents();
			break;

		case 'friends':
			if (state.user && state.user.isAnonymous) {
				navigateTo("dashboard", false);
				showModal({
					title: "Acesso Negado",
					message: "Usuários anônimos não podem ter amigos. Por favor, crie uma conta para ser socializar.",
					type: "danger",
					confirmText: "Voltar ao Menu"
				});
				return;
			}

			app.innerHTML = getFriendsHtml()
			setupFriendsEvents();

			break;

		case 'leaderboard':
			if (state.user && state.user.isAnonymous) {
				navigateTo("dashboard", false);
				showModal({
					title: "Acesso Negado",
					message: "Usuários anônimos não podem acessar o leaderboard. Por favor, crie uma conta para acessar.",
					type: "danger",
					confirmText: "Voltar ao Menu"
				});
				return;
			}
			app.innerHTML = getRankingHtml();
			setupRankingEvents();

			break;

		case 'settings':
			if (state.user && state.user.isAnonymous) {
				navigateTo("dashboard", false);
				showModal({
					title: "Acesso Negado",
					message: "Usuários anônimos não podem acessar as configurações. Por favor, crie uma conta para acessar.",
					type: "danger",
					confirmText: "Voltar ao Menu"
				});
				return;
			}
			app.innerHTML = getSettingsHtml();
			setupSettingsEvents();
			break;

		default:
			navigateTo('login');
	}
}

window.addEventListener('popstate', (event) => {
	const routeState = event.state;

	if (routeState && routeState.route) {
		navigateTo(event.state.route, false);
	} else {
		const path = window.location.pathname.replace('/', '').replace('#', '') as Route;
		navigateTo(path || 'login', false)
	}
});

window.addEventListener('hashchange', () => {
	const path = window.location.hash.replace('#', '') as Route;
	console.log(path)
	navigateTo(path, false);
});

function setupLoginEvents() {
	document.getElementById('btn-login-user')?.addEventListener('click', async () => {
		const userInput = (document.getElementById('input-login-user') as HTMLInputElement).value;
		const passInput = (document.getElementById('input-login-pass') as HTMLInputElement).value;

		if (userInput && passInput) {
			try {
				const response = await authService.login({
					identifier: userInput,
					password: passInput
				});

				localStorage.setItem('token', response.token);

				state.isAuthenticated = true;
				state.user = {
					id: response.user.id,
					name: response.user.name,
					nick: response.user.nick,
					gang: response.user.gang,
					isAnonymous: response.user.isAnonymous,
					// isOnline: response.user.isOnline,
					// score: response.user.score,
					// rank: response.user.rank
					// Puxar dados do back end
					isOnline: true,
					score: 0,
					rank: 0,
					has2FA: true
				};

				localStorage.setItem('appState', JSON.stringify(state));
				navigateTo('dashboard');

			} catch (error) {
				showModal({
					title: "Erro no login",
					message: "Não foi possível realizar o login. Por favor, verifique suas credenciais e tente novamente.",
					type: "danger",
					confirmText: "Tentar novamente"
				});
			}
		}
	})

	document.getElementById('btn-login-guest')?.addEventListener('click', async () => {
		const userAnonymous = (document.getElementById('input-login-guest') as HTMLInputElement).value;

		if (userAnonymous) {
			try {
				const response = await authService.createAnonymous({
					nick: userAnonymous
				});

				localStorage.setItem('token', response.token);
				console.log(response.user);

				state.isAuthenticated = true;
				state.user = {
					id: response.user.id,
					name: response.user.name,
					nick: response.user.nick,
					gang: response.user.gang,
					isAnonymous: response.user.isAnonymous,
					// isOnline: response.user.isOnline,
					// score: response.user.score,
					// rank: response.user.rank
					// Puxar dados do back end
					isOnline: true,
					score: 0,
					rank: 0
				};
				localStorage.setItem('appState', JSON.stringify(state));
				navigateTo('dashboard');

			} catch (error) {
				// Tratar erro
			}

		}
	})

	document.getElementById('btn-register')?.addEventListener('click', () => {
		navigateTo('register');
	})
}

export function setupRegisterEvents() {
	document.getElementById('btn-register-back')?.addEventListener('click', () => {
		navigateTo('login');
	})

	document.getElementById('btn-register-submit')?.addEventListener('click', async () => {
		const name = (document.getElementById('input-register-name') as HTMLInputElement).value;
		const nick = (document.getElementById('input-register-nick') as HTMLInputElement).value;
		const email = (document.getElementById('input-register-email') as HTMLInputElement).value;
		const pass = (document.getElementById('input-register-pass') as HTMLInputElement).value;
		const gang = (document.getElementById('select-register-gang') as HTMLSelectElement).value as 'potatoes' | 'tomatoes';

		if (name && nick && email && pass && gang) {
			try {
				await authService.register({
					name,
					nick,
					email,
					password: pass,
					gang
				});

				showModal({
					title: "Bem-vindo!",
					message: `A conta de ${name} foi criada com sucesso. Prepare-se para a batalha!`,
					type: "success",
					confirmText: "Ir para Login",
					onConfirm: () => {
						navigateTo('login');
					}
				});

			} catch (error) {
				showModal({
					title: "Erro no cadastro",
					message: "Não foi possível criar a conta. Por favor, verifique os dados e tente novamente.",
					type: "danger",
					confirmText: "Tentar novamente"
				});
			}

		} else {
			showModal({
				title: "Erro no cadastro",
				message: "Por favor, preencha todos os campos para criar sua conta.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
		}
	})

	document.getElementById('select-register-gang')?.addEventListener('change', updateRegisterBg);
}

function setup2FAEvents() {
	document.getElementById('btn-2fa-copy')?.addEventListener('click', () => {
		const secret = (document.getElementById('input-2fa-secret') as HTMLInputElement).value;
		navigator.clipboard.writeText(secret);
	});

	document.getElementById('btn-2fa-send')?.addEventListener('click', async () => {
		const tokenInput = document.getElementById('input-2fa-code') as HTMLInputElement;
		const token = tokenInput.value.replace(/\s/g, '');

		if (token.length !== 6) {
			showModal({
				title: "Código inválido",
				message: "O código deve conter exatamente 6 dígitos.",
				type: "danger",
				confirmText: "Corrigir"
			});
			return;
		}

		try {
			// 🔐 Chamada real do backend (exemplo)
			// await authService.enable2FA({ token });

			// ✅ Sucesso
			showModal({
				title: "2FA Ativado",
				message: "A autenticação em dois fatores foi ativada com sucesso.",
				type: "success",
				confirmText: "Voltar ao Dashboard",
				onConfirm: () => {
					navigateTo('dashboard');
				}
			});

		} catch (error) {
			// ❌ Erro
			showModal({
				title: "Falha ao ativar 2FA",
				message: "Não foi possível validar o código. Verifique o token e tente novamente.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
		}
	});

	document.getElementById('btn-2fa-back')?.addEventListener('click', () => {
		navigateTo('settings');
	});
}

function setup2FADisableEvents() {
	const confirmBtn = document.getElementById("btn-2fa-disable-confirm") as HTMLButtonElement;
	const cancelBtn = document.getElementById("btn-2fa-disable-cancel") as HTMLButtonElement;

	confirmBtn?.addEventListener("click", async () => {
		const password = (document.getElementById("input-2fa-disable-password") as HTMLInputElement)?.value;
		const token = (document.getElementById("input-2fa-disable-token") as HTMLInputElement)?.value;

		// Validações básicas (frontend)
		if (!password || password.length < 4) {
			showModal({
				title: "Senha inválida",
				message: "Informe sua senha corretamente.",
				type: "danger"
			});
			return;
		}

		if (!token || token.length !== 6) {
			showModal({
				title: "Código inválido",
				message: "Informe o código de 6 dígitos do autenticador.",
				type: "danger"
			});
			return;
		}

		// 🔐 Simulação de validação OK
		// (no futuro: backend valida senha + token)

		confirmBtn.disabled = true;
		confirmBtn.textContent = "Desativando...";

		// Atualiza estado
		if (state.user) {
			state.user.has2FA = false;
			localStorage.setItem("appState", JSON.stringify(state));
		}

		showModal({
			title: "2FA desativado",
			message: "A autenticação em duas etapas foi desativada com sucesso.",
			type: "success",
			confirmText: "Voltar às configurações",
			onConfirm: () => {
				navigateTo("settings");
			}
		});
	});

	cancelBtn?.addEventListener("click", () => {
		navigateTo("settings");
	});
}

function setupDashboardEvents() {
	document.getElementById('btn-dashboard-logout')?.addEventListener('click', () => {
		showModal({
			title: "Sair",
			message: "Tem certeza que deseja abandonar a arena? Seu progresso não salvo será perdido.",
			type: "danger",
			confirmText: "Sim, Sair",
			cancelText: "Cancelar",
			onConfirm: async () => {

				if (state.user && state.user.isAnonymous) {
					try {
						await authService.logout();
					} catch (error) {
						// Tratar erro
					}
				}

				state.user = null;
				state.isAuthenticated = false;
				localStorage.removeItem('appState');
				localStorage.removeItem('token');
				navigateTo('login');
			}
		});
	})

	document.getElementById('btn-dashboard-profile')?.addEventListener('click', () => {
		navigateTo('profile');
	})

	document.getElementById('btn-dashboard-friends')?.addEventListener('click', () => {
		navigateTo('friends');
	})

		document.getElementById('btn-dashboard-leaderboard')?.addEventListener('click', () => {
		navigateTo('leaderboard');
	})
/* 
		document.getElementById('btn-dashboard-2FA')?.addEventListener('click', () => {

			const has2FA = state.user?.has2FA ?? false;

			// 🔐 2FA já ativado → apenas informa
			if (has2FA) {
				showModal({
					title: "2FA já configurado",
					message: "A autenticação em duas etapas já está ativa nesta conta. Sua segurança está reforçada.",
					type: "success",
					confirmText: "Entendi"
				});
				return;
			}
		
			// 🔓 2FA desativado → vai para setup
			navigateTo('2fa');
	}) */

		document.getElementById('btn-dashboard-config')?.addEventListener('click', () => {
				navigateTo('settings');
	});

}

function setupGameEvents() {

}

function setupProfileEvents() {
	document.getElementById('btn-profile-back')?.addEventListener('click', () => {
		navigateTo('dashboard');
	})

	document.getElementById('btn-profile-save')?.addEventListener('click', async () => {
		const name = (document.getElementById('input-profile-name') as HTMLInputElement).value;

		if (name) {
			showModal({
				title: "Perfil Atualizado",
				message: `Seu nome de exibição foi alterado para ${name}. Continue dominando a arena!`,
				type: "success",
				confirmText: "Voltar ao Menu",
				onConfirm: () => {
					state.user!.name = name;
					localStorage.setItem('appState', JSON.stringify(state));
					navigateTo('dashboard');
				}
			});
		}
	})
}

function setupFriendsEvents() {
	document.getElementById('btn-friends-back')?.addEventListener('click', () => {
		navigateTo('dashboard');
	})
}

function setupRankingEvents() {
	document.getElementById('btn-ranking-back')?.addEventListener('click', () => {
		navigateTo('dashboard');
	})
}

function setupSettingsEvents() {
	document.getElementById('btn-settings-back')?.addEventListener('click', () => {
		navigateTo('dashboard');
	});

	document.getElementById('btn-settings-2fa-enable')?.addEventListener('click', () => {
		navigateTo('2fa');
	});

	document.getElementById('btn-settings-2fa-disable')?.addEventListener('click', () => {
		navigateTo('2fa-disable');
	});
}

function initializeRoute() {
	let hashRoute = window.location.hash.replace('#', '') as Route;
	let initialRoute = (hashRoute || 'login') as Route;

	if (!state.isAuthenticated) {
		initialRoute = 'login';
	}

	navigateTo(initialRoute, false);
}

initializeRoute()
