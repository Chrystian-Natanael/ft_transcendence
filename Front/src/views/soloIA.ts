import { Button } from "../components/Button";
import { state, type Route } from "../store/appState";
import bgPotatoes from "/assets/bg-login-potatoes.png";
import bgTomatoes from "/assets/bg-login-tomatoes.png";
import bgDefault from "/assets/bg-login.png";

export function getSoloIAHtml() {
	const userGang = state.user?.gang || "potatoes";
	const isPotato = userGang === "potatoes";
	const headerColor = isPotato ? "text-yellow-500" : "text-red-500";
	const titleDropShadow = isPotato
		? "drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
		: "drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]";

	const backgroundByGang: Record<string, string> = {
		potatoes: bgPotatoes,
		tomatoes: bgTomatoes,
	};

	const backgroundImage = backgroundByGang[userGang] || bgDefault;

	return `
        <img src="${backgroundImage}" alt="Background"
             class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

        <div id="solo-ia-view-root"
             class="min-h-screen p-4 md:p-6 flex flex-col items-start w-full max-w-6xl mx-auto">

            <!-- Header -->
            <div class="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end
                        gap-4 mb-6 border-b border-white/10 pb-4">
                <h2 class="${headerColor} text-4xl md:text-5xl font-bold tracking-widest ${titleDropShadow}">
                    MODO SOLO
                </h2>

                <div>
                    ${Button({
		id: "btn-solo-back",
		text: "← VOLTAR",
		variant: "ghost",
		className: "w-auto min-w-[120px] max-w-[200px]",
	})}
                </div>
            </div>

            <!-- CADETE + CONTEÚDO -->
            <div class="w-full">
                <div
                    class="bg-black/30 backdrop-blur-md
                           px-8 py-8 rounded-xl
                           border border-white/10
                           shadow-lg
                           flex flex-col gap-6">

                    <!-- Acrônimo -->
                    <span
                        class="${headerColor} text-sm md:text-base font-extrabold
                               tracking-[0.35em] uppercase">
                        C.A.D.E.T.E 🤖
                    </span>

                    <!-- Descrição -->
                    <span
                        class="text-gray-200 text-sm md:text-base
                               leading-relaxed">
                        Computer of Advanced Development for Tactical and Eliminatory Strategies
                    </span>

                    <!-- Divider -->
                    <div class="w-full h-px bg-white/10"></div>

                    <!-- Subtítulo -->
                    <h3 class="text-lg md:text-xl text-white font-bold
                               flex items-center justify-center gap-3 tracking-wide">
                        <span class="text-cyan-400">🔥</span>
                        Selecione a dificuldade
                    </h3>

                    <!-- Botões -->
                    <div class="w-full flex flex-col items-center gap-4 mt-2">

                        <button id="btn-solo-easy"
                            class="w-full max-w-md flex items-center justify-center gap-3
                                   px-6 py-3 rounded-lg
                                   font-bold text-lg
                                   bg-green-600/20 text-green-400
                                   border border-green-500/30
                                   hover:bg-green-600/30 transition">
                            <div class="flex flex-col items-center">
                                <span>Fácil</span>
                            </div>
                            <span class="ml-auto text-xl">🔥</span>
                        </button>

                        <button id="btn-solo-medium"
                            class="w-full max-w-md flex items-center justify-center gap-3
                                   px-6 py-3 rounded-lg
                                   font-bold text-lg
                                   bg-yellow-600/20 text-yellow-400
                                   border border-yellow-500/30
                                   hover:bg-yellow-600/30 transition">
                            <div class="flex flex-col items-center">
                                <span>Médio</span>
                            </div>
                            <span class="ml-auto text-xl">🔥🔥</span>
                        </button>

                        <button id="btn-solo-hard"
                            class="w-full max-w-md flex items-center justify-center gap-3
                                   px-6 py-3 rounded-lg
                                   font-bold text-lg
                                   bg-red-600/20 text-red-400
                                   border border-red-500/30
                                   hover:bg-red-600/30 transition">
                            <span class="flex flex-col items-center">
                                <span>Difícil</span>
                            </span>
                            <span class="ml-auto text-xl">🔥🔥🔥</span>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    `;
}

export function setupSoloIAEvents(navigate: (route: Route, params?: any) => void) {
	document
		.getElementById('btn-solo-easy')
		?.addEventListener('click', () => navigate('game-solo', { difficulty: 1 }));

	document
		.getElementById('btn-solo-medium')
		?.addEventListener('click', () => navigate('game-solo', { difficulty: 2 }));

	document
		.getElementById('btn-solo-hard')
		?.addEventListener('click', () => navigate('game-solo', { difficulty: 3 }));

	document
		.getElementById('btn-solo-back')
		?.addEventListener('click', () => navigate('dashboard'));
}
