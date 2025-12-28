import { Button } from "../components/Button";
import { state, type Route } from "../store/appState";

// imgs
import bgPotatoes from "../assets/bg-login-potatoes.png";
import bgTomatoes from "../assets/bg-login-tomatoes.png";

// --- TIPOS ---
interface Player {
    id: number;
    nick: string;
    avatar: string;
    isOnline: boolean;
}

// --- CONFIGURAÇÃO VISUAL ---
const backgroundByGang = {
    potatoes: bgPotatoes,
    tomatoes: bgTomatoes,
};

// --- HELPER FUNCTIONS (Renderização de Itens) ---
function formatNick(nick: string): string {
    if (nick.length <= 20) return nick;
    return nick.substring(0, 20) + '...';
}

function renderInviteItem(invite: Player): string {
    const displayNick = formatNick(invite.nick);

    return `
        <div class="group flex items-center justify-between gap-3 p-3
                    bg-black/20 rounded-lg border border-white/5 mb-2 w-full
                    hover:bg-white/5 transition-all duration-200">

            <!-- Avatar + Nome -->
            <div class="flex items-center gap-3 min-w-0 overflow-hidden">
                <div class="w-9 h-9 shrink-0 rounded-full bg-slate-700 overflow-hidden
                            border border-white/10">
                    <img src="${invite.avatar}"
                         alt="${invite.nick}"
                         class="w-full h-full object-cover"
                         onerror="this.src='https://ui-avatars.com/api/?name=${invite.nick}&background=random'"/>
                </div>

                <span class="text-sm text-gray-200 font-bold whitespace-nowrap">
                    ${displayNick}
                </span>
            </div>

            <!-- Ações (hover) -->
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">

                ${Button({
                    id: `btn-invite-accept-${invite.id}`,
                    variant: "ghost",
                    icon: "check",
                    className: "btn-invite-action",
                    attributes: `
                        data-action="accept"
                        data-id="${invite.id}"
                        data-nick="${invite.nick}"
                    `
                })}

                ${Button({
                    id: `btn-invite-decline-${invite.id}`,
                    variant: "ghost",
                    icon: "x",
                    className: "btn-invite-action",
                    attributes: `
                        data-action="decline"
                        data-id="${invite.id}"
                        data-nick="${invite.nick}"
                    `
                })}
            </div>
        </div>
    `;
}

function renderRankedColumn(invites: Player[]): string {
    const hasInvites = invites.length > 0;

    const invitesHtml = hasInvites
        ? invites.map(renderInviteItem).join('')
        : `
            <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 italic gap-2 py-8">
                <span class="text-2xl">🕰️</span>
                <p>Ninguém te chamou ainda...</p>
                <p class="text-sm text-gray-500">
                    O matchmaking está te admirando de longe 👀
                </p>
            </div>
        `;

    return `
        <div class="w-full lg:w-1/2 flex flex-col gap-4 h-auto lg:h-full">

            <!-- CARD 1: BOTÃO RANKEADA -->
            <div class="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
                ${Button({
                    id: "btn-ranked-play",
                    text: "🏆 RANKEADA",
                    className: "w-full text-lg tracking-widest font-bold"
                })}
            </div>

            <!-- CARD 2: LISTA DE CONVITES -->
            <div class="bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-xl flex-1">

                <h4 class="text-sm uppercase tracking-widest text-gray-400 mb-3">
                    Convites
                </h4>

                <div class="h-full overflow-y-auto pr-1 md:pr-2
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-thumb]:bg-cyan-600/30
                            [&::-webkit-scrollbar-thumb]:rounded
                            [&::-webkit-scrollbar-thumb]:hover:bg-cyan-600/80">

                    ${invitesHtml}

                </div>
            </div>

        </div>
    `;
}

function renderFriendItem(friend: Player): string {
    const displayNick = formatNick(friend.nick);
    const statusText = friend.isOnline ? "Online" : "Offline";

    return `
        <div class="group flex items-center justify-between gap-3 p-3
                    bg-black/20 rounded-lg border border-white/5 mb-2 w-full
                    hover:bg-white/5 transition-all duration-200">

            <!-- Avatar + Nome + Status -->
            <div class="flex items-center gap-3 min-w-0 overflow-hidden">
                <div class="relative">
                    <div class="w-9 h-9 shrink-0 rounded-full bg-slate-700 overflow-hidden
                                border border-white/10">
                        <img src="${friend.avatar}"
                             alt="${friend.nick}"
                             class="w-full h-full object-cover"
                             onerror="this.src='https://ui-avatars.com/api/?name=${friend.nick}&background=random'"/>
                    </div>

                    <!-- Status online/offline -->
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                        ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}
                        border border-slate-900">
                    </span>
                </div>

                <div class="flex flex-col">
                    <span class="text-sm text-gray-200 font-bold whitespace-nowrap">
                        ${displayNick}
                    </span>
                    <span class="text-[10px] uppercase tracking-wider
                        ${friend.isOnline ? 'text-green-400' : 'text-gray-400'}">
                        ${statusText}
                    </span>
                </div>
            </div>

            <!-- Botão Convidar (hover) -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                ${Button({
                    id: `btn-invite-friend-${friend.id}`,
                    text: "Convidar",
                    variant: "primary",
                    className: "bg-green-600 hover:bg-green-700 text-white btn-friend-invite",
                    attributes: `
                        data-id="${friend.id}"
                        data-nick="${friend.nick}"
                    `
                })}
            </div>
        </div>
    `;
}

function renderCasualColumn(friends: Player[]): string {
    const hasFriends = friends.length > 0;

    const friendsHtml = hasFriends
        ? friends.map(renderFriendItem).join('')
        : `
            <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 italic gap-2 py-8">
                <span class="text-2xl">🫠</span>
                <p>Nenhum amigo online…</p>
                <p class="text-sm text-gray-500">
                    Talvez estejam evitando perder para você 😏
                </p>
            </div>
        `;

    return `
        <div class="w-full lg:w-1/2 flex flex-col gap-4 h-auto lg:h-full">

            <!-- CARD 1: CASUAL (texto) -->
            <div class="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
                <h3 class="text-lg tracking-widest font-bold text-white flex items-center gap-2">
                    🎮 CASUAL
                </h3>
                <p class="text-sm text-gray-400 mt-1">
                    Jogue sem ranking e sem pressão
                </p>
            </div>

            <!-- CARD 2: LISTA DE AMIGOS -->
            <div class="bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-xl border border-white/10 shadow-xl flex-1">

                <h4 class="text-sm uppercase tracking-widest text-gray-400 mb-3">
                    Amigos
                </h4>

                <div class="h-full overflow-y-auto pr-1 md:pr-2
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-thumb]:bg-cyan-600/30
                            [&::-webkit-scrollbar-thumb]:rounded
                            [&::-webkit-scrollbar-thumb]:hover:bg-cyan-600/80">

                    ${friendsHtml}

                </div>
            </div>

        </div>
    `;
}

export async function getMultiplayerHtml() {
    const userGang = state.user?.gang || 'potatoes';
    const isPotato = userGang === 'potatoes';

    // Estilos dinâmicos
    const headerColor = isPotato ? 'text-yellow-500' : 'text-red-500';
    const titleDropShadow = isPotato 
        ? 'drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
        : 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    const backgroundImage = backgroundByGang[userGang];

    // --- SIMULAÇÃO DE DADOS ---
    const rankedInvites: Player[] = [
        { id: 1, nick: "Jogador1", avatar: "", isOnline: true },
        { id: 2, nick: "Jogador2", avatar: "", isOnline: false },
    ];

    const casualFriends: Player[] = [
        { id: 101, nick: "Amigo1", avatar: "", isOnline: true },
        { id: 102, nick: "Amigo2", avatar: "", isOnline: false },
    ];

    return `
        <!-- Background -->
        <img src="${backgroundImage}" alt="Background" 
             class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

        <!-- Container principal -->
        <div id="multiplayer-view-root" class="min-h-screen p-4 md:p-6 flex flex-col items-center w-full max-w-7xl mx-auto">

            <!-- Topo da tela -->
            <div class="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4">
                <h2 class="${headerColor} text-4xl md:text-5xl font-bold tracking-widest ${titleDropShadow}">
                    MULTIPLAYER
                </h2>
                <div class="self-end sm:self-auto">
                    ${Button({
                        id: "btn-multiplayer-back",
                        text: "← VOLTAR",
                        variant: "ghost",
                        className: "w-auto min-w-[120px] max-w-[200px]",
                    })}
                </div>
            </div>

            <!-- Layout das colunas -->
            <div class="w-full flex flex-row gap-4 md:gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-200px)]">

                <!-- Coluna RANKEADA -->
                ${renderRankedColumn(rankedInvites)}

                <!-- Coluna CASUAL -->
                ${renderCasualColumn(casualFriends)}
            </div>

        </div>
    `;
}

export function setupMultiplayerEvents(navigate: (route: Route) => void) {

    // 🔙 Botão Voltar
    document
        .getElementById('btn-multiplayer-back')
        ?.addEventListener('click', () => {
            navigate('dashboard');
        });

    const viewRoot = document.getElementById('multiplayer-view-root');
    if (!viewRoot) return;

    // 🧠 Delegação de eventos
    viewRoot.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        /* =====================================================
         * 🎮 CONVITES — Aceitar / Recusar
         * ===================================================== */
        const actionBtn = target.closest('.btn-invite-action') as HTMLElement;

        if (actionBtn) {
            const action = actionBtn.dataset.action;
            const inviteId = actionBtn.dataset.id;

            if (!action || !inviteId) return;

            // 🔴 RECUSAR
            if (action === 'decline') {
                actionBtn.closest('.group')?.remove();
                return;
            }

            // 🟢 ACEITAR
            if (action === 'accept') {
                navigate('game');
                return;
            }
        }

        /* =====================================================
         * 👥 AMIGOS — Convidar
         * ===================================================== */
        const inviteFriendBtn = target.closest('.btn-friend-invite') as HTMLElement;

        if (inviteFriendBtn) {
            // Evita clique duplo
            if (inviteFriendBtn.classList.contains('is-disabled')) return;

            const nick = inviteFriendBtn.dataset.nick;

            // 🔒 Desabilita visualmente
            inviteFriendBtn.classList.add(
                'is-disabled',
                'bg-gray-500',
                'cursor-not-allowed',
                'opacity-70'
            );

            inviteFriendBtn.classList.remove(
                'bg-green-600',
                'hover:bg-green-700'
            );

            inviteFriendBtn.textContent = 'Convidado';

            console.log(`Convite enviado para ${nick}`);
        }
    });
}
