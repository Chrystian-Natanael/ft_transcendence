import { Form } from "@/components/Form";
import { FriendRequestSchema } from "@/schemas/friends.schemas";
import { validateForm } from "@/utils/formValidation";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { friendsService, type FriendsListResponse } from "../services/friendsRoutes";
import { state, type Route } from "../store/appState";
import { showModal } from "../utils/modalManager";
import bgPotatoes from '/assets/bg-login-potatoes.png';
import bgTomatoes from '/assets/bg-login-tomatoes.png';

interface Friend {
	id: number;
	nick: string;
	avatar: string;
	isOnline: boolean;
}

const backgroundByGang = {
	potatoes: bgPotatoes,
	tomatoes: bgTomatoes,
};

function formatNick(nick: string): string {
	if (nick.length <= 20) return nick;
	return nick.substring(0, 20) + '...';
}

function renderRequestItem(request: any): string {
	const displayNick = formatNick(request.nick);

	return `
		<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 mb-2 w-full">
			<div class="flex items-center gap-3 min-w-0 overflow-hidden mr-2">
				<div class="w-8 h-8 shrink-0 rounded-full bg-slate-700 overflow-hidden border border-white/10">
					<img src="${request.avatar}" alt="${request.nick}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?nick=${request.nick}&background=random'"/>
				</div>
				<span class="text-sm text-gray-200 font-bold whitespace-nowrap">
					${displayNick}
				</span>
			</div>

			<div class="flex gap-1 shrink-0">
				${Button({
		id: `btn-accept-${request.id}`,
		variant: "ghost",
		icon: "check",
		className: "btn-request-action",
		attributes: `data-action="accept" data-nick="${request.nick}" data-id="${request.id}"`
	})}

				${Button({
		id: `btn-deny-${request.id}`,
		variant: "ghost",
		icon: "x",
		className: "btn-request-action",
		attributes: `data-action="decline" data-nick="${request.nick}" data-id="${request.id}"`
	})}
			</div>
		</div>
	`;
}

function renderFriendItem(friend: Friend): string {
	const statusColor = friend.isOnline ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-gray-500";
	const statusText = friend.isOnline ? "Online" : "Offline";

	return `
		<div class="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 mb-3 backdrop-blur-sm">
			<div class="flex items-center gap-4">
				<div class="relative">
					<div class="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-white/10">
						<img src="${friend.avatar}" alt="${friend.nick}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?nick=${friend.nick}&background=random'"/>
					</div>
					<div class="absolute bottom-0 right-0 w-3.5 h-3.5 ${statusColor} rounded-full border-2 border-slate-900" title="${statusText}"></div>
				</div>

				<div class="flex flex-col">
					<span class="text-white font-bold tracking-wide">${friend.nick}</span>
					<span class="text-xs ${friend.isOnline ? "text-green-400" : "text-gray-400"} uppercase font-semibold tracking-wider">
						${statusText}
					</span>
				</div>
			</div>

			<div class="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				${Button({
		id: `btn-friend-remove-${friend.id}`,
		title: "Remover Amigo",
		variant: "ghost",
		icon: "trash",
		className: "btn-friend-remove",
		attributes: `data-id="${friend.id}" data-name="${friend.nick}"`
	})}
			</div>
		</div>
	`;
}

export async function getFriendsHtml() {
	const userGang = state.user?.gang || 'potatoes';
	const isPotato = userGang === 'potatoes';
	const headerColor = isPotato ? 'text-yellow-500' : 'text-red-500';
	const titleDropShadow = isPotato ? 'drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]';
	const backgroundImage = backgroundByGang[userGang];

	let friendsListHtml: string = '';
	let friendCount: number = 0;
	let requestscount: number = 0;
	let requestsListHtml = '';

	try {
		const friendsList = await friendsService.listFriends();
		const mappedFriends = friendsList.map((response: FriendsListResponse): Friend => ({
			id: response.id,
			nick: response.nick,
			avatar: response.avatar || `https://ui-avatars.com/api/?name=${response.nick}&background=random`,
			isOnline: response.isOnline === true,
		}));

		friendCount = mappedFriends.length;

		friendsListHtml = mappedFriends.length !== 0
			? mappedFriends.map(renderFriendItem).join('')
			: `<div class="flex flex-col items-center justify-center py-12 text-center opacity-60">
				<span class="text-4xl mb-4">Forever Alone? 🥔</span>
				<p class="text-gray-400 text-lg">Você ainda não tem amigos adicionados.</p>
			</div>`;

	} catch (error) {
		console.error('Erro ao listar amigos:', error);
		friendsListHtml = `<div class="text-red-400 text-center">Erro ao carregar amigos.</div>`;
	}

	try {
		const incomingRequests = await friendsService.listIncomingRequests();
		requestscount = incomingRequests.length;

		requestsListHtml = incomingRequests.length > 0
			? incomingRequests.map(renderRequestItem).join('')
			: `<div class="text-center py-4 text-gray-500 text-sm italic">Nenhuma solicitação pendente.</div>`;

	} catch (error) {
		console.error('Erro ao carregar solicitações:', error);
		requestsListHtml = `<div class="text-red-400 text-center text-sm">Erro ao carregar.</div>`;
	}

	return `
		<img src="${backgroundImage}" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

		<div id="friends-view-root" class="min-h-screen p-4 md:p-6 flex flex-col items-center w-full max-w-7xl mx-auto">

			<div class="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4">
				<h2 class="${headerColor} text-4xl md:text-5xl font-bold tracking-widest ${titleDropShadow}">				   AMIGOS
				</h2>
				<div class="self-end sm:self-auto">
					${Button({
		id: "btn-friends-back",
		text: "← VOLTAR",
		variant: "ghost",
		className: "w-auto min-w-[120px] max-w-[200px]",
	})}
				</div>
			</div>

			<div class="w-full flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-200px)]">

				<div class="w-full lg:w-1/3 flex flex-col gap-4 h-auto lg:h-full">

					<div class="bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-xl shrink-0 flex flex-col">
						<h3 class="text-lg md:text-xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2">
							<span class="text-yellow-400">⚡</span> Adicionar
						</h3>
						<p class="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Busque pelo nick exato para enviar um convite.</p>

						${Form({
		id: "form-friends-add",
		className: "flex flex-col gap-3 md:gap-4",
		children: `
								${Input({
			id: "input-friends-add",
			placeholder: "Nick do usuário...",
			type: "text",
			attributes: 'required autocomplete="off"'
		})}

								${Button({
			id: "btn-friends-add",
			text: "Adicionar +",
			title: "Enviar solicitação de amizade",
			attributes: 'type="submit"'
		})}
							`
	})}
					</div>

					<div class="bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-xl flex-1 flex flex-col min-h-[300px] lg:min-h-0">
						<div class="flex justify-between items-center mb-3 md:mb-4 shrink-0">
							<h3 class="text-base md:text-lg text-white font-bold flex items-center gap-2">
								<span class="text-pink-400">💌</span> Solicitações
							</h3>
							${requestscount > 0 ? `<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">${requestscount}</span>` : ''}
						</div>

						<div class="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-white/2 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-cyan-600/30 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:hover:bg-cyan-600/80">
							${requestsListHtml}
						</div>
					</div>
				</div>

				<div class="w-full lg:w-2/3 h-auto lg:h-full min-h-[400px] lg:min-h-0">
					<div class="bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-xl h-full flex flex-col">
						<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
							<h3 class="text-lg md:text-xl text-white font-bold flex items-center gap-2">
								<span class="text-blue-400">👥</span> Sua Lista
							</h3>
							<span class="text-xs font-mono text-cyan-500 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/30">
								${friendCount} / 50
							</span>
						</div>

						<div class="overflow-y-auto flex-1 pr-1 md:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-white/2 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-cyan-600/30 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:hover:bg-cyan-600/80">
							${friendsListHtml}
						</div>
					</div>
				</div>

			</div>
		</div>
	`;
}

export function setupFriendsEvents(navigate: (route: Route) => void) {
	document.getElementById('btn-friends-back')?.addEventListener('click', () => {
		navigate('dashboard');
	});

	const formAddFriend = document.getElementById('form-friends-add') as HTMLFormElement;
	formAddFriend?.addEventListener('submit', async (e) => {
		e.preventDefault();

		const input = document.getElementById('input-friends-add') as HTMLInputElement;
		const nick = input?.value;
		const formData = { nick };
		const validation = validateForm(FriendRequestSchema, formData);

		if (!validation.success) {
			showModal({
				title: "Nick inválido",
				message: "O nick deve ter entre 3 e 20 caracteres, contendo apenas letras, números e underscores.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
			return;
		}

		try {
			await friendsService.sendFriendRequest({ nick });
			showModal({
				title: "Convite enviado!",
				message: `O pedido de amizade para ${nick} foi enviado`,
				type: "success",
				confirmText: "OK"
			});
			input.value = '';
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
	});

	const viewRoot = document.getElementById('friends-view-root');

	if (viewRoot) {
		viewRoot.addEventListener('click', async (e) => {
			const target = e.target as HTMLElement;
			const requestBtn = target.closest('.btn-request-action') as HTMLElement;
			if (requestBtn) {
				const nick = requestBtn.getAttribute('data-nick');
				const action = requestBtn.getAttribute('data-action') as 'accept' | 'decline';

				if (nick && action) {
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
							onConfirm: () => navigate('friends')
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
				return;
			}

			const removeBtn = target.closest('.btn-friend-remove') as HTMLElement;
			if (removeBtn) {
				const friendId = removeBtn.getAttribute('data-id');
				const friendName = removeBtn.getAttribute('data-name');

				if (friendId) {
					showModal({
						title: "Remover Amigo",
						message: `Tem certeza que deseja remover ${friendName} da sua lista de amigos?`,
						type: "danger",
						confirmText: "Remover",
						cancelText: "Cancelar",
						onConfirm: async () => {
							try {
								const response = await friendsService.removeFriend(Number(friendId));
								showModal({
									title: "Sucesso",
									message: response.message,
									type: "success",
									confirmText: "OK",
									onConfirm: () => navigate('friends')
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
			}
		});
	}
}
