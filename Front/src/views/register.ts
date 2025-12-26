import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Form } from "@/components/Form";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { setupRegisterEvents } from "@/main";

let theme: "potatoes" | "tomatoes" | "default" = "default"

// --- Lógica do Custom Select ---
function initCustomSelect(selectId: string, onChangeCallback?: (newValue: string) => void) {
	const wrapper = document.getElementById(`wrapper-${selectId}`);
	const trigger = document.getElementById(`trigger-${selectId}`);
	const dropdown = document.getElementById(`dropdown-${selectId}`);
	const hiddenInput = document.getElementById(selectId) as HTMLInputElement;
	const labelSpan = document.getElementById(`label-${selectId}`);
	const icon = trigger?.querySelector('svg');

	if (!wrapper || !trigger || !dropdown || !hiddenInput) return;

	// Toggle Abrir/Fechar
	trigger.addEventListener('click', (e) => {
		e.stopPropagation(); // Impede que o click feche imediatamente

		const isHidden = dropdown.classList.contains('hidden');

		// Fecha outros dropdowns se houver
		document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
		document.querySelectorAll('[id^="trigger-"] svg').forEach(el => el.classList.remove('rotate-180'));

		if (isHidden) {
			dropdown.classList.remove('hidden');
			icon?.classList.add('rotate-180');
			trigger.classList.add('border-cyan-400', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]');
		} else {
			dropdown.classList.add('hidden');
			icon?.classList.remove('rotate-180');
			trigger.classList.remove('border-cyan-400', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]');
		}
	});

	// Selecionar Opção
	wrapper.querySelectorAll('.custom-option').forEach(option => {
		option.addEventListener('click', (e) => {
			e.stopPropagation();
			const value = option.getAttribute('data-value') || "";
			const text = option.textContent?.trim() || "";

			// Atualiza Input Oculto e Texto Visual
			hiddenInput.value = value;
			if (labelSpan) {
				labelSpan.textContent = text;
				labelSpan.classList.remove('text-gray-400');
				labelSpan.classList.add('text-white');
			}

			// Fecha Dropdown
			dropdown.classList.add('hidden');
			icon?.classList.remove('rotate-180');
			trigger.classList.remove('border-cyan-400', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]');

			// Executa callback (ex: mudar o background)
			if (onChangeCallback) onChangeCallback(value);
		});
	});

	// Fechar ao clicar fora
	document.addEventListener('click', (e) => {
		if (!wrapper.contains(e.target as Node)) {
			dropdown.classList.add('hidden');
			icon?.classList.remove('rotate-180');
			trigger.classList.remove('border-cyan-400', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]');
		}
	});
}

export function updateRegisterBg() {
	// Agora pegamos o valor do <input type="hidden">, que funciona igual ao select antigo
	const selectGang = document.getElementById('select-register-gang') as HTMLInputElement | null;
	const buttonSubmit = document.getElementById('btn-register-submit');
	const buttonBack = document.getElementById('btn-register-back');
	const registerBg = document.getElementById('register-bg') as HTMLImageElement | null;

	if (!registerBg || !selectGang)
		return;

	const val = selectGang.value;

	if (val === 'potatoes') {
		registerBg.src = 'src/assets/bg-login-potatoes.png';
		theme = "potatoes";
	} else if (val === 'tomatoes') {
		registerBg.src = 'src/assets/bg-login-tomatoes.png';
		theme = "tomatoes";
	} else {
		registerBg.src = 'src/assets/bg-login.png';
		theme = "default";
	}

	if (buttonSubmit) {
		buttonSubmit.outerHTML = Button({
			id: "btn-register-submit",
			text: "Cadastrar",
			variant: "primary",
			theme: theme,
			className: "w-2/3"
		});
	}
	if (buttonBack) {
		buttonBack.outerHTML = Button({
			id: "btn-register-back",
			text: "Voltar",
			variant: "secondary",
			theme: theme,
			className: "w-1/3"
		})
	}

	// setupRegisterEvents()
}

export function getRegisterHtml() {
	// Timeout para garantir que o HTML foi renderizado antes de adicionar os eventos de clique
	setTimeout(() => {
		initCustomSelect('select-register-gang', () => {
			updateRegisterBg();
		});
	}, 0);

	return `
		<img id="register-bg" src="src/assets/bg-login.png" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30 transition-opacity duration-500" />
		<div class="min-h-screen flex justify-center items-center p-5">
			${Card({
				className: "max-w-xl w-full animate-fade-in relative z-10",
				children: `
					<h2 class="text-cyan-500 mb-2 text-4xl font-bold drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Criar Conta</h2>
					<p class="text-gray-400 text-lg mb-8">Junte-se à revolução do Pong.</p>

					<div>
						${Form({
							id: "form-register",
							className: "space-y-4",
							children: `
								<div>
									${Input({
										id: "input-register-name",
										placeholder: "Nome Completo",
										attributes: 'required autocomplete="name"'
									})}
								</div>

								<div>
									${Input({
										id: "input-register-nick",
										placeholder: "Nick (Usuário)",
										attributes: 'required autocomplete="username"'
									})}
								</div>

								<div>
									${Input({
										id: "input-register-email",
										type: "email",
										placeholder: "Email",
										attributes: 'required autocomplete="email"'
									})}
								</div>

								<div>
									${Input({
										id: "input-register-password",
										type: "password",
										placeholder: "Senha",
										attributes: 'required autocomplete="new-password"'
									})}
								</div>

								<div>
									${Select({
										id: "select-register-gang",
										placeholder: "Escolha sua aliança...",
										options: [
											{ value: "potatoes", label: "🥔 Gangue das Batatas" },
											{ value: "tomatoes", label: "🍅 Gangue dos Tomates" }
										]
									})}
								</div>

								<div class="flex gap-4 mt-8">
									${Button({
										id: "btn-register-back",
										text: "Voltar",
										variant: "secondary",
										className: "w-1/3",
										attributes: 'type="button"'
									})}
									${Button({
										id: "btn-register-submit",
										text: "Cadastrar",
										variant: "primary",
										className: "w-2/3",
										// attributes: 'type="submit"'
									})}
								</div>
							`
						})}
					</div>

					<p id="register-error" class="text-red-400 text-center mt-4 hidden font-bold"></p>
				`
			})}
		</div>
	`;
}
