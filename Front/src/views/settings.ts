import { authService } from "../services/authRoutes";
import { state, type Route } from "../store/appState";
import { showModal } from "../utils/modalManager";
import bgPotatoes from '/assets/bg-login-potatoes.png';
import bgTomatoes from '/assets/bg-login-tomatoes.png';
import bgDefault from '/assets/bg-login.png';

export function getSettingsHtml() {
	const user = state.user;
	const selectedGang = (user?.gang || 'potatoes') as 'potatoes' | 'tomatoes';

	const backgrounds = { potatoes: bgPotatoes, tomatoes: bgTomatoes };
	const bgSrc = backgrounds[selectedGang] || bgDefault;

	const settingsColor = selectedGang === "tomatoes" ? "text-red-500" : selectedGang === "potatoes" ? "text-yellow-500" : "text-cyan-500";
	const has2FA = user?.has2FA ?? false;
	const isAnonymous = user?.isAnonymous ?? false;

	const twoFAStatusText = has2FA ? "Autenticação em duas etapas está ativa." : "Autenticação em duas etapas está desativada.";

	return `
        <img src="${bgSrc}" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

        <div class="min-h-screen p-6 flex flex-col items-center max-w-6xl mx-auto">
            <div class="w-full flex justify-between items-end mb-10 border-b border-white/10 pb-4">
                <h2 class="${settingsColor} text-5xl font-bold tracking-widest">CONFIGURAÇÕES</h2>
                <button id="btn-settings-back" class="text-gray-400 hover:text-white font-bold cursor-pointer transition-colors">VOLTAR</button>
            </div>

            <div class="w-full grid grid-cols-1 gap-6">

                <div class="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-white mb-4">Segurança 🔒</h3>
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p class="text-gray-300 font-medium">Autenticação em duas etapas (2FA)</p>
                            <p class="text-gray-400 text-sm">${twoFAStatusText}</p>
                        </div>
                        <div class="flex flex-col gap-2 min-w-[160px]">
                            ${has2FA
			? `<button id="btn-settings-2fa-status" class="px-5 py-2 rounded-lg font-bold bg-green-600/20 text-green-400 cursor-default border border-green-500/30">✅ 2FA Ativo</button>
                                   <button id="btn-settings-2fa-disable" class="px-5 py-2 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-[0_0_10px_rgba(220,38,38,0.3)]">Desativar 2FA</button>`
			: `<button id="btn-settings-2fa-enable" class="px-5 py-2 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-[0_0_10px_rgba(8,145,178,0.3)]">Ativar 2FA</button>`
		}
                        </div>
                    </div>
                </div>

                <div class="bg-red-900/10 backdrop-blur-md border border-red-500/20 rounded-xl p-6 mt-4">
                    <h3 class="text-xl font-bold text-red-500 mb-2">Zona de Perigo ⚠️</h3>
                    <p class="text-gray-400 text-sm mb-4">Ações irreversíveis. Tenha cuidado.</p>

                    <button id="btn-delete-account-init" class="w-full md:w-auto px-6 py-3 rounded-lg font-bold bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition duration-300">
                        EXCLUIR CONTA
                    </button>
                </div>
            </div>
        </div>

        <div id="modal-delete-account" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden animate-fade-in">
            <div class="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                <h3 class="text-2xl font-bold text-red-500 mb-2">Tem certeza?</h3>
                <p class="text-gray-300 mb-6">Essa ação não pode ser desfeita. Todos os seus dados, ranking e amigos serão perdidos.</p>

                ${!isAnonymous ? `
                <div class="space-y-4 mb-6">
                    <div>
                        <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Confirme sua senha</label>
                        <input id="input-del-password" type="password" class="w-full bg-slate-800 border border-white/10 rounded p-3 text-white focus:border-red-500 outline-none" placeholder="Sua senha atual">
                    </div>

                    ${has2FA ? `
                    <div>
                        <label class="block text-xs text-gray-500 uppercase font-bold mb-1">Token 2FA</label>
                        <input id="input-del-token" type="text" class="w-full bg-slate-800 border border-white/10 rounded p-3 text-white focus:border-red-500 outline-none" placeholder="Código de 6 dígitos">
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                <div class="flex gap-3">
                    <button id="btn-modal-cancel" class="flex-1 py-3 rounded-lg font-bold bg-slate-700 hover:bg-slate-600 text-white transition">Cancelar</button>
                    <button id="btn-modal-confirm-delete" class="flex-1 py-3 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-900/20">
                        Confirmar Exclusão
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function setupSettingsEvents(navigate: (route: Route) => void) {
	const user = state.user;

	document.getElementById('btn-settings-back')?.addEventListener('click', () => navigate('dashboard'));
	document.getElementById('btn-settings-2fa-enable')?.addEventListener('click', () => navigate('2fa'));
	document.getElementById('btn-settings-2fa-disable')?.addEventListener('click', () => navigate('2fa-disable'));

	const modal = document.getElementById('modal-delete-account');
	const btnInit = document.getElementById('btn-delete-account-init');
	const btnCancel = document.getElementById('btn-modal-cancel');
	const btnConfirm = document.getElementById('btn-modal-confirm-delete');

	btnInit?.addEventListener('click', () => {
		modal?.classList.remove('hidden');
	});

	btnCancel?.addEventListener('click', () => {
		modal?.classList.add('hidden');

		const passInput = document.getElementById('input-del-password') as HTMLInputElement;
		const tokenInput = document.getElementById('input-del-token') as HTMLInputElement;
		if (passInput) passInput.value = '';
		if (tokenInput) tokenInput.value = '';
	});

	btnConfirm?.addEventListener('click', async (e) => {
		const targetBtn = e.currentTarget as HTMLElement;
		const currentModal = targetBtn.closest('#modal-delete-account');

		if (!currentModal) return;

		const passInput = currentModal.querySelector('#input-del-password') as HTMLInputElement;
		const tokenInput = currentModal.querySelector('#input-del-token') as HTMLInputElement;

		const password = passInput?.value?.trim();
		const token = tokenInput?.value?.trim();

		if (user && !user.isAnonymous) {
			if (!password) {
				showModal({ title: "Erro", message: "Digite sua senha para confirmar.", type: "danger" });
				passInput?.focus();
				return;
			}
			if (user.has2FA && !token) {
				showModal({ title: "Erro", message: "Digite o código 2FA.", type: "danger" });
				tokenInput?.focus();
				return;
			}
		}

		try {
			await authService.deleteAccount({ password, token });

			state.user = null;
			state.isAuthenticated = false;
			localStorage.removeItem('appState');
			localStorage.removeItem('token');

			showModal({
				title: "Conta Deletada",
				message: "Sua conta foi excluída permanentemente. Você será redirecionado.",
				type: "success",
				confirmText: "Adeus...",
				onConfirm: () => navigate('login')
			});

		} catch (error: any) {
			const msg = error.response?.data?.error || error.message || "Erro ao deletar conta.";
			showModal({ title: "Falha na exclusão", message: msg, type: "danger" });
		}
	});
}
