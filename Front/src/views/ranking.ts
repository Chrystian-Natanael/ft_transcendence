import { Button } from "@/components/Button";
import { state } from "@/main";

const backgroundByGang = {
	potatoes: 'src/assets/bg-login-potatoes.png',
	tomatoes: 'src/assets/bg-login-tomatoes.png',
};

export interface User {
	id: number;
	name: string;
	nick: string;
	avatar?: string;
	isAnonymous: boolean;
	score: number;
	rank: number;
	isOnline: boolean;
	gang: 'potatoes' | 'tomatoes';
}

// --- Mock Data (Adaptado para a interface User) ---
const potatoPlayers: User[] = [
	{ id: 1, name: "User1", nick: "Batata_Rei", avatar: "src/assets/avatar-king.png", score: 9850, gang: 'potatoes', isAnonymous: false, rank: 1, isOnline: true },
	{ id: 2, name: "User2", nick: "Mr_Chips", avatar: "src/assets/perfil-batata.png", score: 8500, gang: 'potatoes', isAnonymous: false, rank: 2, isOnline: false },
	{ id: 3, name: "User3", nick: "Purê_Destruidor", avatar: "src/assets/avatar-pure.png", score: 7200, gang: 'potatoes', isAnonymous: false, rank: 3, isOnline: true },
	{ id: 4, name: "User4", nick: "Batata_Frita_123", avatar: "src/assets/avatar-fry.png", score: 6100, gang: 'potatoes', isAnonymous: false, rank: 4, isOnline: false },
	{ id: 5, name: "User5", nick: "Ruffles_Original", avatar: "src/assets/avatar-ruffles.png", score: 5400, gang: 'potatoes', isAnonymous: false, rank: 5, isOnline: true },
	{ id: 6, name: "User6", nick: "Batata_Doce_Fit", avatar: "src/assets/avatar-sweet.png", score: 4300, gang: 'potatoes', isAnonymous: false, rank: 6, isOnline: false },
	{ id: 7, name: "User7", nick: "Noob_Potato", avatar: "src/assets/avatar-noob.png", score: 1200, gang: 'potatoes', isAnonymous: false, rank: 7, isOnline: true },
];

const tomatoPlayers: User[] = [
	{ id: 101, name: "User101", nick: "Ketchup_Master", avatar: "src/assets/avatar-ketchup.png", score: 9900, gang: 'tomatoes', isAnonymous: false, rank: 1, isOnline: true },
	{ id: 102, name: "User102", nick: "Tomate_Guerreiro", avatar: "src/assets/perfil-tomate.png", score: 8700, gang: 'tomatoes', isAnonymous: false, rank: 2, isOnline: false },
	{ id: 103, name: "User103", nick: "Pomodoro_Vital", avatar: "src/assets/avatar-pomodoro.png", score: 7800, gang: 'tomatoes', isAnonymous: false, rank: 3, isOnline: true },
	{ id: 104, name: "User104", nick: "Molho_Picante", avatar: "src/assets/avatar-sauce.png", score: 6500, gang: 'tomatoes', isAnonymous: false, rank: 4, isOnline: false },
	{ id: 105, name: "User105", nick: "Tomate_Seco", avatar: "src/assets/avatar-dried.png", score: 5000, gang: 'tomatoes', isAnonymous: false, rank: 5, isOnline: true },
	{ id: 106, name: "User106", nick: "Salada_Mista", avatar: "src/assets/avatar-salad.png", score: 4100, gang: 'tomatoes', isAnonymous: false, rank: 6, isOnline: false },
	{ id: 107, name: "User107", nick: "Semente_do_Mal", avatar: "src/assets/avatar-seed.png", score: 900, gang: 'tomatoes', isAnonymous: false, rank: 7, isOnline: true },
];

// --- Helpers de Cálculo ---
const totalPotatoScore = potatoPlayers.reduce((acc, curr) => acc + curr.score, 0);
const totalTomatoScore = tomatoPlayers.reduce((acc, curr) => acc + curr.score, 0);
const totalGlobalScore = totalPotatoScore + totalTomatoScore;
// Evita divisão por zero
const potatoPercentage = totalGlobalScore > 0 ? Math.round((totalPotatoScore / totalGlobalScore) * 100) : 50;

// --- Helpers de Renderização ---

function formatName(name: string): string {
	if (name.length <= 15) return name;
	return name.substring(0, 15) + '...';
}

function renderRankItem(player: User, index: number): string {
	// Lógica de tema baseada na gangue ('potatoes' ou 'tomatoes')
	const isPotato = player.gang === 'potatoes';

	const themeColor = isPotato ? "text-yellow-400" : "text-red-400";
	const borderColor = isPotato ? "hover:border-yellow-500/50" : "hover:border-red-500/50";
	// Efeito de brilho ao focar/clicar
	const glowColor = isPotato ? "group-focus:shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "group-focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]";

	// Status Online/Offline (Bolinha)
	const statusColor = player.isOnline ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-gray-500";

	// Medalhas para top 3
	let rankDisplay = `<span class="font-mono text-gray-400 font-bold">#${index + 1}</span>`;
	if (index === 0) rankDisplay = `<span class="text-2xl">🥇</span>`;
	if (index === 1) rankDisplay = `<span class="text-2xl">🥈</span>`;
	if (index === 2) rankDisplay = `<span class="text-2xl">🥉</span>`;


	return `
		<div
			tabindex="0"
			class="group relative flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-lg mb-2 transition-all duration-300 cursor-pointer ${borderColor} ${glowColor} outline-none"
		>
			<div class="flex items-center gap-3 md:gap-4">
				<div class="w-8 flex justify-center shrink-0">
					${rankDisplay}
				</div>

				<div class="relative shrink-0">
					<div class="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
						<img src="${player.avatar || 'src/assets/perfil-inexistente.png'}" alt="${player.nick}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${player.nick}&background=random'"/>
					</div>
					<div class="absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor} rounded-full border border-slate-900"></div>
				</div>

				<div class="flex flex-col">
					<span class="text-white font-bold text-sm md:text-base truncate w-[100px] md:w-auto" title="${player.nick}">
						${formatName(player.nick)}
					</span>
					<span class="${themeColor} text-xs font-mono font-bold">${player.score.toLocaleString()} PTS</span>
				</div>
			</div>

			<div class="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 absolute right-3 md:static bg-slate-900 md:bg-transparent pl-2 rounded shadow-lg md:shadow-none z-10">
				<button
					id="btn-rank-add-${player.id}"
					class="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-[0_0_10px_rgba(8,145,178,0.5)] cursor-pointer"
				>
					<span>+ Add</span>
				</button>
			</div>
		</div>
	`;
}


export function getRankingHtml() {
	// --- Lógica do Usuário Ativo ---
	// Recupera dados do state global (assumindo que 'state.user' segue a interface User)
	const user: User | undefined = state.user;

	// Dados de fallback caso user seja null/undefined
	const nick = user ? user.nick : "Visitante";
	const gang = user?.gang || 'potatoes'; // Default
	const avatar = user?.avatar || "src/assets/perfil-inexistente.png";
	const score = user?.score || 0;
	const rank = user?.rank || "-";

	// Definição de cores baseada na gangue do usuário logado
	const isPotato = gang === 'potatoes';
	const userThemeColor = isPotato ? 'text-yellow-400' : 'text-red-400';
	const userBorderColor = isPotato ? 'border-yellow-500' : 'border-red-500';
	const userShadowColor = isPotato ? 'shadow-[0_0_10px_#eab308]' : 'shadow-[0_0_10px_#ef4444]';
	const headerColor = isPotato ? 'text-yellow-400' : 'text-red-400';
	const titleDropShadow = isPotato ? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]';


	// Background customizável por gangue
	const backgroundImage = backgroundByGang[gang];
	const avatarSrc = gang === "potatoes" ? "src/assets/perfil-batata.png" : "src/assets/perfil-tomate.png";

	return `
		<style>
			.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
			.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 4px; }
			.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 4px; }
			.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.8); }
		</style>

		<img src="${backgroundImage}" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

		<div class="min-h-screen p-4 md:p-6 flex flex-col items-center max-w-6xl mx-auto">

			<div class="w-full flex justify-between items-end mb-6 border-b border-white/10 pb-4">
				<h2 class="${headerColor} text-4xl md:text-5xl font-bold tracking-widest ${titleDropShadow}">
					RANKING
				</h2>
				<div class="self-end sm:self-auto">
					${Button({
						id: "btn-ranking-back",
						text: "← VOLTAR",
						variant: "ghost",
						className: "w-auto min-w-[120px] max-w-[200px]",
					})}
				</div>
			</div>

			<div class="w-full mb-8 animate-fade-in-down">
				<div class="flex justify-between text-xs md:text-sm font-bold mb-2 uppercase tracking-widest">
					<span class="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">🥔 Batatas: ${totalPotatoScore.toLocaleString()}</span>
					<span class="text-gray-400">vs</span>
					<span class="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">Tomates: ${totalTomatoScore.toLocaleString()} 🍅</span>
				</div>

				<div class="w-full h-6 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
					<div class="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 absolute left-0 top-0 transition-all duration-1000 ease-out flex items-center justify-start pl-2" style="width: ${potatoPercentage}%">
						<span class="text-[10px] text-black font-bold opacity-70">${potatoPercentage}%</span>
					</div>
					<div class="h-full bg-gradient-to-l from-red-600 to-red-500 w-full -z-10 absolute top-0 right-0 flex items-center justify-end pr-2">
						<span class="text-[10px] text-white font-bold opacity-70">${100 - potatoPercentage}%</span>
					</div>
					<div class="absolute top-0 bottom-0 w-1 bg-white blur-[2px] z-10" style="left: ${potatoPercentage}%"></div>
				</div>
			</div>

			<div class="w-full mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="w-14 h-14 rounded-full border-2 ${userBorderColor} ${userShadowColor} overflow-hidden">
						 <img src="${avatarSrc}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${nick}&background=random'"/>
					</div>
					<div>
						<p class="text-cyan-400 text-xs font-bold uppercase tracking-wider">Seu Desempenho</p>
						<h3 class="text-white text-xl font-bold">${nick}</h3>
					</div>
				</div>
				<div class="text-right">
					<p class="text-gray-400 text-xs uppercase">Ranking Global</p>
					<p class="text-3xl font-bold text-white">#${rank}</p>
					<p class="text-xs ${userThemeColor} font-bold">${score.toLocaleString()} PTS</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full overflow-hidden">

				<div class="flex flex-col bg-slate-900/40 backdrop-blur-md rounded-xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)] h-[500px]">
					<div class="p-4 border-b border-white/5 bg-yellow-500/5 rounded-t-xl">
						<h3 class="text-xl font-bold text-yellow-400 flex items-center gap-2">
							<span>🥔</span> Gangue Batata
						</h3>
					</div>
					<div class="flex-1 overflow-y-auto custom-scrollbar p-3">
						${potatoPlayers.map((p, i) => renderRankItem(p, i)).join('')}
					</div>
				</div>

				<div class="flex flex-col bg-slate-900/40 backdrop-blur-md rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] h-[500px]">
					 <div class="p-4 border-b border-white/5 bg-red-500/5 rounded-t-xl">
						<h3 class="text-xl font-bold text-red-400 flex items-center gap-2">
							<span>🍅</span> Gangue Tomate
						</h3>
					</div>
					<div class="flex-1 overflow-y-auto custom-scrollbar p-3">
						${tomatoPlayers.map((p, i) => renderRankItem(p, i)).join('')}
					</div>
				</div>

			</div>
		</div>
	`;
}
