import './style.css';
import { showModal } from './utils/modalManager';
import { getDashboardHtml } from './views/dashboard';
import { getFriendsHtml } from './views/friends';
import { getRankingHtml } from './views/ranking';
import { get2FAHtml } from './views/twofa';
import { getLogin2FAHtml } from './views/login2fa';
import { getGameHtml, GameController } from './views/game'; 
import { io, Socket } from 'socket.io-client';

import { authService } from './services/authRoutes';
import { friendsService } from './services/friendsRoutes';
import { getLoginHtml } from './views/login';
import { getProfileHtml } from './views/profile';
import { getRegisterHtml, updateRegisterBg } from './views/register';
import { getSettingsHtml } from './views/settings';
import { get2FADisableHtml } from './views/twofaDisable';
import { loginSchema, registerSchema } from './schemas/auth.schemas';
import { clearFormErrors, displayFormErrors, validateForm } from './utils/formValidation';

type Route = 'login' | 'register' | '2fa' | '2fa-disable' | 'dashboard' | 'game' | 'profile' | 'friends' | 'leaderboard' | 'settings'| 'login2fa';

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

let activeGameController: GameController | null = null;
let gameSocket: Socket | null = null;

function navigateTo(route: Route, addToHistory = true) {
	if (route === 'dashboard' || route === 'profile') {
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

async function renderView(route: Route) {
	// --- BLOCO DE LIMPEZA (CRUCIAL) ---
    // Destrói o jogo anterior se existir
    if (activeGameController) {
        activeGameController.destroy();
        activeGameController = null;
    }
    // Garante que o socket seja desconectado mesmo se o Controller falhou
    if (gameSocket && gameSocket.connected) {
        gameSocket.disconnect();
        gameSocket = null;
    }
    // ----------------------------------
	switch (route) {
		case 'login':
			if (state.isAuthenticated) {
				navigateTo('dashboard', false);
				return;
			}

			app.innerHTML = getLoginHtml();
			setupLoginEvents();
			break;

		case 'login2fa':
			if (!localStorage.getItem('tempToken')) {
				navigateTo('login', false);
				return;
			}
			app.innerHTML = getLogin2FAHtml();
			setupLogin2FAEvents();
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
				try {
					const response = await authService.setup2FA();
					console.log(response)

					app.innerHTML = get2FAHtml({
						qrCodeUrl: response.qrcode,
						secret: response.secret
					});
					setup2FAEvents();

				} catch (error: any) {
					showModal({
						title: "Erro",
						message: error.message || "Não foi possível ativar os dois fatores",
						type: "danger",
						confirmText: "Tentar novamente",
					});
					return ;
				}
			break;

		case '2fa-disable':
			app.innerHTML = get2FADisableHtml();
			setup2FADisableEvents();
			break;

		case 'dashboard':
			app.innerHTML = getDashboardHtml();
			setupDashboardEvents();
			break;

		case 'game':
             app.innerHTML = getGameHtml();
             setupGameEvents();
             break;

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

			app.innerHTML = await getFriendsHtml()
			await setupFriendsEvents();

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
			app.innerHTML = await getRankingHtml();
			setupRankingEvents(navigateTo);

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
// 	document.getElementById('btn-login-user')?.addEventListener('click', async () => {
// 		const userInput = (document.getElementById('input-login-user') as HTMLInputElement).value;
// 		const passInput = (document.getElementById('input-login-pass') as HTMLInputElement).value;
//
// 		if (userInput && passInput) {
// 			try {
// 				const response = await authService.login({
// 					identifier: userInput,
// 					password: passInput
// 				});
//
// 				if (response.requires2FA && response.tempToken) {
// 					console.log("TEMP TOKEN: " + response.tempToken)
// 					localStorage.setItem('tempToken', response.tempToken);
//
// 					state.user = {
// 						id: 0, // Placeholder
// 						name: '',
// 						nick: '',
// 						isAnonymous: false,
// 						score: 0,
// 						rank: 0,
// 						isOnline: false,
// 						has2FA: true,
// 						gang: 'potatoes' // Pega do response ou default
// 					};
//
// 					// 3. Navega para a tela de input do código
// 					navigateTo('login2fa');
// 					return;
// 				}
// 				// ---------------------------
//
// 				// Fluxo normal (sem 2FA)
// 				localStorage.setItem('token', response.token);
// 				state.isAuthenticated = true;
// 				state.user = {
// 					id: response.user.id,
// 					name: response.user.name,
// 					nick: response.user.nick,
// 					gang: response.user.gang,
// 					isAnonymous: response.user.isAnonymous,
// 					isOnline: true,
// 					score: 0,
// 					rank: 0,
// 					has2FA: response.user.has2FA
// 				};
//
// 				localStorage.setItem('appState', JSON.stringify(state));
// 				navigateTo('dashboard');
//
// 			} catch (error) {
// 				showModal({
// 					title: "Erro no login",
// 					message: "Não foi possível realizar o login. Por favor, verifique suas credenciais e tente novamente.",
// 					type: "danger",
// 					confirmText: "Tentar novamente"
// 				});
// 			}
// 		}
// 	})

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
					rank: 0,
					has2FA: response.user.has2FA
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

// 	document.getElementById('btn-register-submit')?.addEventListener('click', async () => {
// 		const name = (document.getElementById('input-register-name') as HTMLInputElement).value;
// 		const nick = (document.getElementById('input-register-nick') as HTMLInputElement).value;
// 		const email = (document.getElementById('input-register-email') as HTMLInputElement).value;
// 		const pass = (document.getElementById('input-register-pass') as HTMLInputElement).value;
// 		const gang = (document.getElementById('select-register-gang') as HTMLSelectElement).value as 'potatoes' | 'tomatoes';
//
// 		if (name && nick && email && pass && gang) {
// 			try {
// 				await authService.register({
// 					name,
// 					nick,
// 					email,
// 					password: pass,
// 					gang
// 				});
//
// 				showModal({
// 					title: "Bem-vindo!",
// 					message: `A conta de ${name} foi criada com sucesso. Prepare-se para a batalha!`,
// 					type: "success",
// 					confirmText: "Ir para Login",
// 					onConfirm: () => {
// 						navigateTo('login');
// 					}
// 				});
//
// 			} catch (error) {
// 				showModal({
// 					title: "Erro no cadastro",
// 					message: "Não foi possível criar a conta. Por favor, verifique os dados e tente novamente.",
// 					type: "danger",
// 					confirmText: "Tentar novamente"
// 				});
// 			}
//
// 		} else {
// 			showModal({
// 				title: "Erro no cadastro",
// 				message: "Por favor, preencha todos os campos para criar sua conta.",
// 				type: "danger",
// 				confirmText: "Tentar novamente"
// 			});
// 		}
// 	})

	const form = document.getElementById('form-register') as HTMLFormElement;

	form?.addEventListener('submit', async (e) => {
		e.preventDefault();

		// Coletar dados do formulário
		const formData = {
			name: (document.getElementById('input-register-name') as HTMLInputElement).value,
			nick: (document.getElementById('input-register-nick') as HTMLInputElement).value,
			email: (document.getElementById('input-register-email') as HTMLInputElement).value,
			password: (document.getElementById('input-register-password') as HTMLInputElement).value,
			gang: (document.getElementById('select-register-gang') as HTMLInputElement).value
		};

		// Validar com Zod
		const validation = validateForm(registerSchema, formData);

		if (!validation.success) {
			displayFormErrors('form-register', validation.errors);
			return;
		}

		// Limpar erros anteriores
		clearFormErrors('form-register');

		try {
			await authService.register(validation.data);

			showModal({
				title: "Conta criada!",
				message: "Sua conta foi criada com sucesso. Faça login para continuar.",
				type: "success",
				confirmText: "Fazer Login",
				onConfirm: () => navigateTo('login')
			});

		} catch (error: any) {
			showModal({
				title: "Erro no cadastro",
				message: error.message || "Não foi possível criar a conta.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
		}
	})

	document.getElementById('select-register-gang')?.addEventListener('change', updateRegisterBg);
}



function showCopyToast() {
	const toast = document.createElement('div');
	toast.innerText = "Copiado!";

	toast.className = `
		fixed bottom-10 left-1/2 -translate-x-1/2
		bg-emerald-600 text-white text-xs font-bold
		px-4 py-2 rounded-full shadow-lg
		transform transition-all duration-300 ease-out
		translate-y-2 opacity-0
		z-50
	`;

	document.body.appendChild(toast);

	requestAnimationFrame(() => {
		toast.classList.remove('translate-y-2', 'opacity-0');
	});

	setTimeout(() => {
		toast.classList.add('translate-y-2', 'opacity-0'); // Animação de saída
		setTimeout(() => {
			toast.remove();
		}, 300);
	}, 2000);
}

function formatBackupCodesHtml(codes: string[]): string {
	if (!codes || codes.length === 0) return "Nenhum código gerado.";

	// Gera os itens da grade (número + código)
	const gridItemsHtml = codes.map((code, index) => `
		<div class="flex items-center space-x-2 p-1">
			<span class="text-gray-500 font-mono select-none text-xs">${index + 1}.</span>
			<span class="font-mono text-white tracking-wider text-sm">${code}</span>
		</div>
	`).join('');

	const rawCodesString = codes.join('\n');

	return `
		<p class="mb-4 text-sm text-gray-300 text-center">
			Guarde estes códigos em um local seguro. Você precisará deles para acessar sua conta se perder seu dispositivo 2FA.
		</p>

		<div
			id="backup-codes-container"
			data-codes="${encodeURIComponent(rawCodesString)}"
			class="bg-slate-950/60 p-4 rounded-lg border border-white/10 mb-5 text-left shadow-inner overflow-hidden relative group"
		>
			<div class="grid grid-cols-2 gap-x-4 gap-y-2 relative z-10">
				${gridItemsHtml}
			</div>
			<div class="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
		</div>

		<div class="flex justify-center mb-6">
			<button
				id="btn-copy-backup-codes"
				class="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-bold px-4 py-2 rounded border border-white/10 transition-all duration-200 active:scale-[0.98]"
			>
				<span class="text-sm">📋</span> <span id="btn-copy-backup-text">Copiar Todos</span>
			</button>
		</div>
	`;
}

function setup2FAEvents() {
	document.getElementById('btn-2fa-copy')?.addEventListener('click', () => {
	const secretInput = document.getElementById('input-2fa-secret') as HTMLInputElement;
	const secret = secretInput.value;

	navigator.clipboard.writeText(secret).then(() => {
		showCopyToast();

		const btn = document.getElementById('btn-2fa-copy');
		if (btn) {
			const originalText = btn.innerHTML;
			btn.innerHTML = "✅";
			setTimeout(() => btn.innerHTML = originalText, 2000);
		}
	}).catch(err => {
		console.error('Falha ao copiar:', err);
	});
});

	document.getElementById('btn-2fa-back')?.addEventListener('click', () => {
		navigateTo('settings');
	});

	document.getElementById('btn-2fa-send')?.addEventListener('click', async () => {
		const tokenInput = document.getElementById('input-2fa-code') as HTMLInputElement;
		const tokenValue = tokenInput.value.replace(/\s/g, '');
		const secretCode = (document.getElementById('input-2fa-secret') as HTMLInputElement).value;

		if (tokenValue.length !== 6) {
			showModal({
				title: "Código inválido",
				message: "O código deve conter exatamente 6 dígitos.",
				type: "danger",
				confirmText: "Corrigir"
			});
			return;
		}

		try {
			const response = await authService.enable2FA({
				token: tokenValue,
				secret: secretCode,
			});

			if (response.message === '2FA habilitado com sucesso') {
				if (state.user) {
					state.user.has2FA = true;
				}

				const backupCodesHtml = formatBackupCodesHtml(response.backupCodes);

				showModal({
					title: "2FA Habilitado!",
					message: backupCodesHtml,
					type: "success",
					confirmText: "OK, já salvei",
					onConfirm: () => {
						 navigateTo("settings");
					}
				});

				const copyBtn = document.getElementById('btn-copy-backup-codes');
				const container = document.getElementById('backup-codes-container');
				const copyTextSpan = document.getElementById('btn-copy-backup-text');

				if (copyBtn && container && copyTextSpan) {
					copyBtn.addEventListener('click', () => {
						const rawCodes = decodeURIComponent(container.getAttribute('data-codes') || '');

						navigator.clipboard.writeText(rawCodes).then(() => {
							const originalText = copyTextSpan.innerText;
							copyTextSpan.innerText = "Códigos Copiados! ✅";
							copyBtn.classList.add('bg-emerald-900/50', '!text-emerald-200', '!border-emerald-500/50');

							setTimeout(() => {
								copyTextSpan.innerText = originalText;
								copyBtn.classList.remove('bg-emerald-900/50', '!text-emerald-200', '!border-emerald-500/50');
							}, 2500);
						}).catch(err => console.error('Erro ao copiar códigos de backup', err));
					});
				}
			}

		} catch (error : any) {
			showModal({
				title: "Falha ao ativar 2FA",
				message: error.message || "Não foi possível validar o código",
				type: "danger",
				confirmText: "Tentar novamente",
			});
			return;
		}
	});
}

function setup2FADisableEvents() {
	const confirmBtn = document.getElementById("btn-2fa-disable-confirm") as HTMLButtonElement;
	const cancelBtn = document.getElementById("btn-2fa-disable-cancel") as HTMLButtonElement;

	confirmBtn?.addEventListener("click", async () => {
		const tokenValue = (document.getElementById("input-2fa-disable-token") as HTMLInputElement)?.value;


		if (!tokenValue || tokenValue.length !== 6) {
			showModal({
				title: "Código inválido",
				message: "Informe o código de 6 dígitos do autenticador.",
				type: "danger"
			});
			return;
		}

		try {

			const response = await authService.disable2FA({
				token: tokenValue,
			});

		if (response.message === '2FA desabilitado com sucesso') {

			if (state.user) {
				state.user.has2FA = false;
				// localStorage.setItem("appState", JSON.stringify(state)); Precisa disso???
			}

			showModal({
				title: "2FA desabilitado com sucesso",
				type: "success",
				message: "",
				confirmText: "OK",
			});

			navigateTo("settings")

		}

		} catch (error : any) {
			showModal({
				title: "Falha ao desativar 2FA",
				message: error.message || "Não foi possível validar o código",
				type: "danger",
				confirmText: "Tentar novamente",
			});
			return ;

		}
	});


		// 🔐 Simulação de validação OK
		// (no futuro: backend valida senha + token)

// 		confirmBtn.disabled = true;
// 		confirmBtn.textContent = "Desativando...";

// 		// Atualiza estado
// 		if (state.user) {
// 			state.user.has2FA = false;
// 			localStorage.setItem("appState", JSON.stringify(state));
// 		}

// 		showModal({
// 			title: "2FA desativado",
// 			message: "A autenticação em duas etapas foi desativada com sucesso.",
// 			type: "success",
// 			confirmText: "Voltar às configurações",
// 			onConfirm: () => {
// 				navigateTo("settings");
// 			}
// 		});
// 	});

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
		document.getElementById('btn-dashboard-config')?.addEventListener('click', () => {
				navigateTo('settings');
	});

}

function setupGameEvents() {
    // 1. SEGURANÇA: Se já existir um socket, mate-o antes de criar outro.
    if (gameSocket) {
        console.log("Fechando conexão antiga para evitar duplicidade...");
        gameSocket.disconnect();
        gameSocket = null; // Limpa a referência
    }

    // 2. Cria a nova conexão limpa
    console.log("Iniciando nova conexão de jogo...");
    gameSocket = io('http://localhost:3333'); 

    gameSocket.on('connect', () => {
        console.log("Conectado ao servidor do jogo! ID:", gameSocket?.id);
        
        // Só cria o controller se ele ainda não existir
        if (!activeGameController && gameSocket) {
            activeGameController = new GameController(gameSocket);
        }
    });

    gameSocket.on('connect_error', (err) => {
        console.error("Erro de conexão:", err);
    });
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

	document.getElementById('btn-friends-add')?.addEventListener('click', async () => {
		const nick = (document.getElementById('input-friends-add') as HTMLInputElement).value;

		if (nick) {
			try {
				await friendsService.sendFriendRequest({
					nick
				})

				showModal({
					title: "Convite enviado!",
					message: `O pedido de amizade para ${nick} foi enviado`,
					type: "success",
					confirmText: "OK"
				});
			} catch (e: any) {
				console.error('Erro capturado:', e);
				const errorMessage = e.message || e.response?.data?.error || `Não foi possível convidar ${nick}`;

				showModal({
					title: "Erro no pedido",
					message: errorMessage,
					type: "danger",
					confirmText: "Tentar novamente"
				});
			}
		}
	})

	const requestsContainer = document.querySelector('.overflow-y-auto'); // Ajuste o seletor para o container das solicitações
	document.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement;
		const btn = target.closest('.btn-request-action') as HTMLElement;

		if (btn) {
			const nick = btn.getAttribute('data-nick');
			const action = btn.getAttribute('data-action') as 'accept' | 'decline';
			const id = btn.getAttribute('data-id');

			if (!nick || !action) return;

			try {
				const response = await friendsService.respondFriendRequest({
					nick: nick,
					action: action
				});

				showModal({
					title: action === 'accept' ? "Sucesso!" : "Recusado",
					message: response.message,
					type: "success",
					confirmText: "OK",
					onConfirm: () => {
						navigateTo('friends', false);
					}
				});
			} catch (error: any) {
				showModal({
					title: "Erro",
					message: error.message || "Não foi possível processar a solicitação",
					type: "danger",
					confirmText: "Tentar novamente"
				});
			}
		}
	});

	document.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement;
		const removeBtn = target.closest('.btn-friend-remove') as HTMLElement;

		if (removeBtn) {
			const friendId = removeBtn.getAttribute('data-id');
			const friendName = removeBtn.getAttribute('data-name');

			if (!friendId) return;

			showModal({
				title: "Remover Amigo",
				message: `Tem certeza que deseja remover ${friendName} da sua lista de amigos?`,
				type: "danger",
				confirmText: "Remover",
				cancelText: "Cancelar",
				onConfirm: async () => {
					try {
						console.log("ID que está indo para a URL:", friendId);
						const response = await friendsService.removeFriend(Number(friendId));

						showModal({
							title: "Sucesso",
							message: response.message,
							type: "success",
							confirmText: "OK",
							onConfirm: () => {
								navigateTo('friends', false);
							}
						});
					} catch (error: any) {
						showModal({
							title: "Erro",
							message: error.message || "Não foi possível remover o amigo",
							type: "danger",
							confirmText: "Tentar novamente"
						});
					}
				}
			});
		}
	});
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

function setupRankingEvents(navigateTo: Function) { // Passando navigateTo se necessário, ou importe

	document.getElementById('btn-ranking-back')?.addEventListener('click', () => {
		navigateTo('dashboard');
	});

	const container = document.getElementById('ranking-lists-container');
	if (!container) return;

	container.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement;

		// --- ADICIONAR AMIGO ---
		const addBtn = target.closest('.btn-rank-add') as HTMLElement;
		if (addBtn) {
			const nick = addBtn.getAttribute('data-nick');
			if (nick) {
				try {
					await friendsService.sendFriendRequest({ nick });
					showModal({
						title: "Sucesso",
						message: `Solicitação enviada para ${nick}!`,
						type: "success"
					});
					addBtn.innerHTML = "<span>Enviado</span>";
					addBtn.classList.add('opacity-50', 'cursor-not-allowed');
				} catch (error: any) {
					showModal({
						title: "Erro",
						message: error.message || "Falha ao enviar solicitação",
						type: "danger"
					});
				}
			}
		}

		// --- REMOVER AMIGO ---
		const removeBtn = target.closest('.btn-rank-remove') as HTMLElement;
		if (removeBtn) {
			const id = removeBtn.getAttribute('data-id');
			const nick = removeBtn.getAttribute('data-nick');

			if (id && nick) {
				showModal({
					title: "Remover Amigo",
					message: `Tem certeza que deseja remover ${nick} dos amigos?`,
					type: "danger",
					confirmText: "Remover",
					cancelText: "Cancelar",
					onConfirm: async () => {
						try {
							await friendsService.removeFriend(Number(id));
							showModal({
								title: "Removido",
								message: "Amizade desfeita.",
								type: "success",
								onConfirm: () => {
									window.location.reload();
								}
							});
						} catch (error: any) {
							showModal({
								title: "Erro",
								message: error.message,
								type: "danger"
							});
						}
					}
				});
			}
		}
	});
}

function setupLogin2FAEvents() {
	document.getElementById('btn-login-2fa-cancel')?.addEventListener('click', () => {
		localStorage.removeItem('tempToken');
		state.user = null;
		navigateTo('login');
	});

    document.getElementById('btn-login-2fa-confirm')?.addEventListener('click', async () => {
        const tokenInput = document.getElementById('input-login-2fa-code') as HTMLInputElement;
        // const code = tokenInput.value.replace(/\s/g, '').replace('-', '');
        const code = tokenInput.value;

        // if (code.length !== 6 && code.length !== 8) {
        //     showModal({
        //         title: "Código inválido",
        //         message: "O código deve ter 6 ou 8 dígitos.",
        //         type: "danger"
        //     });
        //     return;
        // }

		const tempToken = localStorage.getItem('tempToken');
		if (!tempToken) {
			navigateTo('login');
			return;
		}

		try {
			const response = await authService.login2FA({
				token: code,
			});

			localStorage.setItem('token', response.token);
			localStorage.removeItem('tempToken');

			state.isAuthenticated = true;
			state.user = {
				id: response.user.id,
				name: response.user.name,
				nick: response.user.nick,
				gang: response.user.gang,
				isAnonymous: response.user.isAnonymous,
				isOnline: true,
				score: 0,
				rank: 0,
				has2FA: true
			};

			localStorage.setItem('appState', JSON.stringify(state));
			navigateTo('dashboard');

		} catch (error: any) {
			showModal({
				title: "Acesso Negado",
				message: error.message || "Código incorreto ou expirado.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
			tokenInput.value = "";
			tokenInput.focus();
		}
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
