import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Form } from "@/components/Form";
import { Input } from "@/components/Input";
import { anonymousSchema, loginSchema } from "@/schemas/auth.schemas";
import { authService } from "@/services/authRoutes";
import { validateForm } from "@/utils/formValidation";
import { showModal } from "@/utils/modalManager";
import { saveState, state, type Route } from '../store/appState';

export function getLoginHtml() {
	return `
		<img src="/assets/bg-login.png" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />
		<div class="min-h-screen flex justify-center items-center p-5">

			${Card({
		className: "max-w-md w-full text-center",
		children: `

					<h2 class="text-cyan-500 mb-4 text-6xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,1.8)] font-cartoon cartoon-title">
					<div class="text-yellow-400 cartoon-title yellow">
						POTATOES
					</div>
					<div class="text-cyan-300 text-4xl font-bold">vs</div>
					<div class="text-red-600 cartoon-title red">
						TOMATOES
					</div>
					</h2>

					${Button({
			id: "btn-register",
			text: "Criar Conta",
			variant: "secondary",
			className: "mb-6"
		})}

					${Form({
			id: "form-login",
			className: "space-y-4 text-left",
			children: `
							<div>
								<label class="block text-sm text-gray-400 mb-1 ml-1">Login</label>
								${Input({
				id: "input-login-user",
				placeholder: "Seu usuário ou email",
				attributes: 'required autocomplete="username"'
			})}
							</div>

							<div>
								<label class="block text-sm text-gray-400 mb-1 ml-1">Senha</label>
								${Input({
				id: "input-login-pass",
				type: "password",
				placeholder: "••••••",
				attributes: 'required autocomplete="current-password"'
			})}
							</div>

							${Button({
				id: "btn-login-user",
				text: "Entrar",
				variant: "primary",
				className: "mt-8",
				attributes: 'type="submit"'
			})}
						`
		})}

					<div class="mt-6 border-t border-white/10 pt-6" />

					${Form({
			id: "form-login-guest",
			className: "space-y-4",
			children: `
							${Input({
				id: "input-login-guest",
				placeholder: "Seu usuário",
				attributes: 'required'
			})}

							${Button({
				id: "btn-login-guest",
				text: "Entrar como Visitante",
				variant: "ghost",
				className: "text-sm underline decoration-transparent hover:decoration-white",
				attributes: 'type="submit"'
			})}
						`
		})}
				`
	})}

		</div>
	`
}

export function setupLoginEvents(navigate: (route: Route) => void) {
	const formLogin = document.getElementById('form-login') as HTMLFormElement;
	formLogin?.addEventListener('submit', async (e) => {
		e.preventDefault();

		const userInput = (document.getElementById('input-login-user') as HTMLInputElement).value;
		const passInput = (document.getElementById('input-login-pass') as HTMLInputElement).value;

		const formData = {
			identifier: userInput,
			password: passInput
		}

		const validation = validateForm(loginSchema, formData);

		if (!validation.success) {
			showModal({
				title: "Credenciais inválidas",
				message: "Usuário ou senha inválidos.",
				type: "danger",
				confirmText: "Tentar novamente"
			})
			return;
		}

		try {
			const response = await authService.login({
				identifier: userInput,
				password: passInput
			});

			if (response.requires2FA && response.tempToken) {
				console.log("TEMP TOKEN: " + response.tempToken);
				localStorage.setItem('tempToken', response.tempToken);

				state.user = {
					id: 0,
					name: '',
					nick: '',
					isAnonymous: false,
					score: 0,
					rank: 0,
					isOnline: false,
					has2FA: true,
					gang: 'potatoes'
				};

				navigate('login2fa');
				return;
			}

			localStorage.setItem('token', response.token);
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
				has2FA: response.user.has2FA,
				avatar: response.user.avatar
			};

			saveState();
			navigate('dashboard');

		} catch (error) {
			showModal({
				title: "Erro no login",
				message: "Não foi possível realizar o login. Verifique suas credenciais.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
		}
	});

	const formGuest = document.getElementById('form-login-guest') as HTMLFormElement;
	formGuest?.addEventListener('submit', async (e) => {
		e.preventDefault();

		const userAnonymous = (document.getElementById('input-login-guest') as HTMLInputElement).value;

		const formData = {
			nick: userAnonymous
		}

		const validation = validateForm(anonymousSchema, formData);

		if (!validation.success) {
			showModal({
				title: "Nick inválido",
				message: "O nick deve ter entre 3 e 20 caracteres, contendo apenas letras, números e underscores.",
				type: "danger",
				confirmText: "Tentar novamente"
			})
			return;
		}

		try {
			const response = await authService.createAnonymous({
				nick: userAnonymous
			});

			localStorage.setItem('token', response.token);

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
				has2FA: response.user.has2FA,
				avatar: response.user.avatar
			};

			saveState();
			navigate('dashboard');

		} catch (error) {
			showModal({
				title: "Erro no login",
				message: "Não foi possível entrar como visitante.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
		}
	});

	document.getElementById('btn-register')?.addEventListener('click', () => {
		navigate('register');
	});
}
