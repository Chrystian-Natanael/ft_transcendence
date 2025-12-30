import { DashboardItem } from "@/components/DashboardItem";
import { authService } from "@/services/authRoutes";
import { showModal } from "@/utils/modalManager";
import { state, type Route } from '../store/appState';
import bgPotatoes from '/assets/bg-login-potatoes.png';
import bgTomatoes from '/assets/bg-login-tomatoes.png';
import bgDefault from '/assets/bg-login.png';

const backgroundByGang = {
	potatoes: bgPotatoes,
	tomatoes: bgTomatoes,
};

export function getDashboardHtml() {
	const user = state.user;
	const selectedGang = (user?.gang || 'potatoes') as 'potatoes' | 'tomatoes';

	const bgSrc = backgroundByGang[selectedGang] || bgDefault;

	const dashboardColor =
		selectedGang === "tomatoes"
			? "text-red-500"
			: selectedGang === "potatoes"
				? "text-yellow-500"
				: "text-cyan-500";

	return `
		<img id="bg-image" src="${bgSrc}" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30 transition-all duration-500" />

		<div class="min-h-screen p-6 flex flex-col items-center max-w-6xl mx-auto">

			<div class="w-full flex justify-between items-end mb-10 border-b border-white/10 pb-4">
				<h2 class="${dashboardColor} text-5xl font-bold tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
					DASHBOARD
				</h2>
				<button id="btn-dashboard-logout" class="text-red-500 hover:text-red-400 hover:underline transition font-bold cursor-pointer">
					SAIR
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">

				${DashboardItem({
		id: "btn-dashboard-multiplayer",
		title: "Multiplayer",
		subtitle: "Jogar Online",
		icon: "⚔️",
		colorTheme: "purple"
	})}

				${DashboardItem({
		id: "btn-dashboard-solo",
		title: "Modo Solo",
		subtitle: "Treinar Habilidades - Enfrentar C.A.D.E.T.E",
		icon: "🤖",
		colorTheme: "indigo"
	})}

				${DashboardItem({
		id: "btn-dashboard-leaderboard",
		title: "Ranking",
		subtitle: "Ver Posições",
		icon: "🏆",
		colorTheme: "green"
	})}

				${DashboardItem({
		id: "btn-dashboard-friends",
		title: "Amigos",
		subtitle: "Gerenciar Lista",
		icon: "👥",
		colorTheme: "blue"
	})}

				${DashboardItem({
		id: "btn-dashboard-profile",
		title: "Perfil",
		subtitle: "Estatísticas",
		icon: "📊",
		colorTheme: "gray"
	})}

				${DashboardItem({
		id: "btn-dashboard-config",
		title: "Configurações",
		subtitle: "Ajustes do Sistema",
		icon: "⚙️",
		colorTheme: "yellow"
	})}

			</div>
		</div>
	`;
}

export function setupDashboardEvents(navigate: (route: Route) => void) {
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
						console.error("Erro ao deslogar anônimo", error);
					}
				}

				state.user = null;
				state.isAuthenticated = false;
				localStorage.removeItem('appState');
				localStorage.removeItem('token');

				navigate('login');
			}
		});
	});

	document.getElementById('btn-dashboard-multiplayer')?.addEventListener('click', () => {
		navigate('multiplayer');
	});

	document.getElementById('btn-dashboard-solo')?.addEventListener('click', () => {
		navigate('soloIA');
	});

	document.getElementById('btn-dashboard-profile')?.addEventListener('click', () => {
		navigate('profile');
	});

	document.getElementById('btn-dashboard-friends')?.addEventListener('click', () => {
		navigate('friends');
	});

	document.getElementById('btn-dashboard-leaderboard')?.addEventListener('click', () => {
		navigate('leaderboard');
	});

	document.getElementById('btn-dashboard-config')?.addEventListener('click', () => {
		navigate('settings');
	});
}
