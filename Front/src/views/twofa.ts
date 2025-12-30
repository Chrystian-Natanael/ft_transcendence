import { Form } from "@/components/Form";
import { enable2FASchema } from "@/schemas/auth.schemas";
import { validateForm } from "@/utils/formValidation";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { authService } from "../services/authRoutes";
import { state, type Route } from "../store/appState";
import { showModal } from "../utils/modalManager";
import bgPotatoes from '/assets/bg-login-potatoes.png';
import bgTomatoes from '/assets/bg-login-tomatoes.png';

const backgroundByGang = {
	potatoes: bgPotatoes,
	tomatoes: bgTomatoes,
};

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
	requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));
	setTimeout(() => {
		toast.classList.add('translate-y-2', 'opacity-0');
		setTimeout(() => toast.remove(), 300);
	}, 2000);
}

function formatBackupCodesHtml(codes: string[]): string {
	const user = state.user;
	const gang = user?.gang || 'potatoes';

	if (!codes || codes.length === 0) return "Nenhum código gerado.";

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

export function get2FAHtml(data: { qrCodeUrl: string; secret: string; }) {
	const user = state.user;
	const gang = user?.gang || 'potatoes';
	const isPotato = gang === 'potatoes';

	const buttonTheme = isPotato ? 'potatoes' : 'tomatoes';
	const titleColor = isPotato ? 'text-yellow-400' : 'text-red-400';
	const titleGlow = isPotato ? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]';
	const cardBorder = isPotato ? 'border-yellow-500/30' : 'border-red-500/30';
	const cardShadow = isPotato ? 'shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.15)]';
	const backgroundImage = backgroundByGang[gang];

	return `
		<img src="${backgroundImage}" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30"/>

		<div class="min-h-screen flex justify-center items-center p-5">
			${Card({
		className: `max-w-md w-full text-center bg-slate-900/40 backdrop-blur-md border ${cardBorder} ${cardShadow}`,
		children: `
					<h2 class="${titleColor} ${titleGlow} mb-4 text-4xl font-bold">Ativar 2FA</h2>
					<p class="text-gray-400 text-sm mb-6">Escaneie o QR Code com seu aplicativo autenticador e confirme com o código gerado.</p>

					<div class="flex justify-center mb-6">
						<img src="${data.qrCodeUrl}" alt="QR Code 2FA" class="w-40 h-40 bg-white p-2 rounded-lg shadow-md"/>
					</div>

					<div class="mb-6 text-left">
						<label class="text-xs text-gray-400 font-bold uppercase mb-1 block">Secret</label>
						<div class="flex items-center gap-2">
							<input id="input-2fa-secret" type="text" readonly value="${data.secret}" class="flex-1 bg-slate-800/80 text-gray-300 text-sm font-mono px-3 py-2 rounded border border-white/10 text-center"/>
							<button id="btn-2fa-copy" class="text-cyan-400 hover:text-cyan-300 text-sm cursor-pointer" title="Copiar secret">📋</button>
						</div>
					</div>

					${Form({
			id: "form-2fa-enable",
			className: "mb-6",
			children: `
							<label class="text-xs text-gray-400 font-bold uppercase mb-1 block">Código do autenticador</label>
							${Input({
				id: "input-2fa-code",
				placeholder: "000 000",
				className: `text-center text-3xl tracking-[0.5em] font-mono bg-slate-800/80 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.4)] py-4`
			})}
						`
		})}

					<div class="mb-6">

					</div>

					${Button({
			id: "btn-2fa-send",
			text: "Ativar 2FA",
			variant: "primary",
			theme: buttonTheme,
			attributes: 'type="submit" form="form-2fa-enable"'
		})}
					${Button({ id: "btn-2fa-back", text: "Cancelar", variant: "ghost", className: "mt-4 text-sm" })}
				`
	})}
		</div>
	`;
}

export function setup2FAEvents(navigate: (route: Route) => void) {
	document.getElementById('btn-2fa-copy')?.addEventListener('click', () => {
		const secretInput = document.getElementById('input-2fa-secret') as HTMLInputElement;
		navigator.clipboard.writeText(secretInput.value).then(() => {
			showCopyToast();
			const btn = document.getElementById('btn-2fa-copy');
			if (btn) {
				const originalText = btn.innerHTML;
				btn.innerHTML = "✅";
				setTimeout(() => btn.innerHTML = originalText, 2000);
			}
		}).catch(err => console.error('Falha ao copiar:', err));
	});

	document.getElementById('btn-2fa-back')?.addEventListener('click', () => {
		navigate('settings');
	});

	const form2faEnable = document.getElementById('form-2fa-enable') as HTMLFormElement;
	form2faEnable?.addEventListener('submit', async (e) => {
		e.preventDefault();

		const token = (document.getElementById('input-2fa-code') as HTMLInputElement)?.value;
		const secret = (document.getElementById('input-2fa-secret') as HTMLInputElement).value;

		const formData = {
			token
		};

		const validation = validateForm(enable2FASchema, formData);

		if (!validation.success) {
			showModal({
				title: "Token inválido",
				message: "O token deve conter exatamente 6 dígitos numéricos.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
			return;
		}

		try {
			const response = await authService.enable2FA({
				token,
				secret,
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
					onConfirm: () => navigate('settings')
				});

				setTimeout(() => {
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
							});
						});
					}
				}, 100);
			}
		} catch (error: any) {
			showModal({
				title: "Falha ao ativar 2FA",
				message: error.message || "Não foi possível validar o código",
				type: "danger",
				confirmText: "Tentar novamente",
			});
		}
	})
}
