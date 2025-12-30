import { Button } from "../components/Button";
import { friendsService } from "../services/friendsRoutes";
import { leaderboardService } from "../services/leaderboardRoutes";
import { state, type Route } from "../store/appState";
import { showModal } from "../utils/modalManager";
import bgPotatoes from '/assets/bg-login-potatoes.png';
import bgTomatoes from '/assets/bg-login-tomatoes.png';
import bgDefault from '/assets/bg-login.png';

const backgroundByGang = {
	potatoes: bgPotatoes,
	tomatoes: bgTomatoes,
};

function formatName(name: string): string {
	if (name.length <= 15) return name;
	return name.substring(0, 15) + '...';
}

export interface LeaderboardUser {
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

function renderRankItem(player: LeaderboardUser, index: number, currentUserId: number, friendIds: number[]): string {
	const isPotato = player.gang === 'potatoes';
	const isMe = player.id === currentUserId;
	const isFriend = friendIds.includes(player.id);

	const themeColor = isPotato ? "text-yellow-400" : "text-red-400";
	const borderColor = isPotato ? "hover:border-yellow-500/50" : "hover:border-red-500/50";
	const glowColor = isPotato ? "group-focus:shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "group-focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]";
	const statusColor = player.isOnline ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-gray-500";

	let rankDisplay = `<span class="font-mono text-gray-400 font-bold">#${index + 1}</span>`;
	if (index === 0) rankDisplay = `<span class="text-2xl">🥇</span>`;
	if (index === 1) rankDisplay = `<span class="text-2xl">🥈</span>`;
	if (index === 2) rankDisplay = `<span class="text-2xl">🥉</span>`;

	let actionButton = '';

	if (!isMe) {
		if (isFriend) {
			actionButton = `
                <button
                    class="btn-rank-remove flex items-center gap-1 bg-red-900/80 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer"
                    data-id="${player.id}"
                    data-nick="${player.nick}"
                    title="Remover Amigo"
                >
                    <i class="fas fa-user-minus"></i> <span>Remover</span>
                </button>
            `;
		} else {
			actionButton = `
                <button
                    class="btn-rank-add flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-[0_0_10px_rgba(8,145,178,0.5)] cursor-pointer"
                    data-nick="${player.nick}"
                    title="Adicionar Amigo"
                >
                    <i class="fas fa-user-plus"></i> <span>Add</span>
                </button>
            `;
		}
	} else {
		actionButton = `<span class="text-xs text-gray-500 font-bold px-2">VOCÊ</span>`;
	}

	const avatar = player.avatar || '//assets/perfil-sla.png';

	return `
        <div tabindex="0" class="group relative flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-lg mb-2 transition-all duration-300 cursor-pointer ${borderColor} ${glowColor} outline-none">
            <div class="flex items-center gap-3 md:gap-4">
                <div class="w-8 flex justify-center shrink-0">
                    ${rankDisplay}
                </div>

                <div class="relative shrink-0">
                    <div class="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                        <img src="${avatar}" alt="${player.nick}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${player.nick}&background=random'"/>
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

            <div class="opacity-100 md:opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 absolute right-3 md:static bg-slate-900 md:bg-transparent pl-2 rounded shadow-lg md:shadow-none z-10 flex items-center">
                ${actionButton}
            </div>
        </div>
    `;
}

export async function getRankingHtml() {
	const user = state.user;
	if (!user) return `<div class="p-10 text-white">Erro: Usuário não logado</div>`;

	let players: LeaderboardUser[] = [];
	let myFriendsIds: number[] = [];

	try {
		const [leaderboardData, friendsData] = await Promise.all([
			leaderboardService.getLeaderboard(),
			friendsService.listFriends()
		]);

		players = leaderboardData.map((u: any) => ({
			...u,
			isAnonymous: u.isAnonymous ?? false
		}));
		myFriendsIds = friendsData.map((f: any) => f.id);

	} catch (error) {
		console.error("Erro ao carregar ranking", error);
		return `<div class="p-10 text-red-500 text-center">Falha ao carregar ranking. Tente novamente mais tarde.</div>`;
	}

	const potatoPlayers = players.filter(p => p.gang === 'potatoes');
	const tomatoPlayers = players.filter(p => p.gang === 'tomatoes');

	const totalPotatoScore = potatoPlayers.reduce((acc, curr) => acc + curr.score, 0);
	const totalTomatoScore = tomatoPlayers.reduce((acc, curr) => acc + curr.score, 0);
	const totalGlobalScore = totalPotatoScore + totalTomatoScore;
	const potatoPercentage = totalGlobalScore > 0 ? Math.round((totalPotatoScore / totalGlobalScore) * 100) : 50;

	const nick = user.nick;
	const gang = user.gang;
	const currentUserInRanking = players.find(p => p.id === user.id);
	const score = currentUserInRanking ? currentUserInRanking.score : (user.score || 0);
	const rank = currentUserInRanking ? currentUserInRanking.rank : "-";

	const isPotato = gang === 'potatoes';
	const userThemeColor = isPotato ? 'text-yellow-400' : 'text-red-400';
	const userBorderColor = isPotato ? 'border-yellow-500' : 'border-red-500';
	const userShadowColor = isPotato ? 'shadow-[0_0_10px_#eab308]' : 'shadow-[0_0_10px_#ef4444]';
	const headerColor = isPotato ? 'text-yellow-400' : 'text-red-400';
	const titleDropShadow = isPotato ? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]';
	const backgroundImage = backgroundByGang[gang] || bgDefault;
	const avatarSrc = currentUserInRanking?.avatar || user.avatar || "//assets/perfil-sla.png";

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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full overflow-hidden" id="ranking-lists-container">

                <div class="flex flex-col bg-slate-900/40 backdrop-blur-md rounded-xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)] h-[500px]">
                    <div class="p-4 border-b border-white/5 bg-yellow-500/5 rounded-t-xl">
                        <h3 class="text-xl font-bold text-yellow-400 flex items-center gap-2">
                            <span>🥔</span> Gangue Batata
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-3">
                        ${potatoPlayers.map((p, i) => renderRankItem(p, i, user.id, myFriendsIds)).join('')}
                    </div>
                </div>

                <div class="flex flex-col bg-slate-900/40 backdrop-blur-md rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] h-[500px]">
                     <div class="p-4 border-b border-white/5 bg-red-500/5 rounded-t-xl">
                        <h3 class="text-xl font-bold text-red-400 flex items-center gap-2">
                            <span>🍅</span> Gangue Tomate
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-3">
                        ${tomatoPlayers.map((p, i) => renderRankItem(p, i, user.id, myFriendsIds)).join('')}
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function setupRankingEvents(navigate: (route: Route) => void) {
	document.getElementById('btn-ranking-back')?.addEventListener('click', () => {
		navigate('dashboard');
	});

	const container = document.getElementById('ranking-lists-container');
	if (!container) return;

	container.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement;
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
									navigate('leaderboard');
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
