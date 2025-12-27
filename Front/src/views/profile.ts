// src/views/profile.ts
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { saveState, state, type Route } from "../store/appState";
import { showModal } from "../utils/modalManager";

//imgs
import bgPotatoes from '../assets/bg-login-potatoes.png';
import bgTomatoes from '../assets/bg-login-tomatoes.png';
import bgDefault from '../assets/bg-login.png';
import { Form } from "@/components/Form";
import { validateForm } from "@/utils/formValidation";
import { nickSchema } from "@/schemas/common.schemas";

// --- HELPER LOCAL ---
const StatItem = (label: string, valueId: string, colorClass: string = "text-white") => `
	<div class="bg-black/30 p-4 rounded-xl border border-white/5 text-center hover:border-white/10 transition">
		<p class="text-xs text-gray-500 uppercase tracking-widest mb-1">${label}</p>
		<p id="${valueId}" class="text-2xl font-bold ${colorClass}">-</p>
	</div>
`;

// --- HTML ---
export function getProfileHtml() {
	const user = state.user;
	const selectedGang = (user?.gang || 'potatoes') as 'potatoes' | 'tomatoes';


	// Ajuste de caminhos de assets (remove 'src' para funcionar no public)
	const backgrounds = {
		potatoes: bgPotatoes,
		tomatoes: bgTomatoes,
	};

	const bgSrc = backgrounds[selectedGang] || bgDefault;
	const avatarSrc = selectedGang === "potatoes" ? "/assets/perfil-batata.png" : "/assets/perfil-tomate.png"; // foto de perfil padron

	// Estilos dinâmicos
	const headerColor = selectedGang === "tomatoes" ? "text-red-500" : selectedGang === "potatoes" ? "text-yellow-500" : "text-cyan-500";
	const avatarBorder = selectedGang === "potatoes" ? "border-yellow-500" : selectedGang === "tomatoes" ? "border-red-500" : "border-cyan-500";
	const titleGlow = selectedGang === "potatoes" ? "drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" : selectedGang === "tomatoes" ? "drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]";

	const nick = user ? user.nick : "Visitante";

	return `
		<img id="bg-image" src="${bgSrc}" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

		<div class="min-h-screen p-4 md:p-6 flex flex-col items-center w-full max-w-5xl mx-auto">
			<div class="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4">
				<h2 class="${headerColor} text-2xl sm:text-3xl md:text-4xl font-bold tracking-widest ${titleGlow}">
					CONFIGURAÇÕES DO PERFIL
				</h2>
				<div class="self-end sm:self-auto">
					${Button({
						id: "btn-profile-back",
						text: "← VOLTAR",
						variant: "ghost",
						className: "w-auto min-w-[120px] max-w-[200px]",
					})}
				</div>
			</div>

			${Card({
				className: "max-w-5xl w-full bg-slate-900/80 backdrop-blur-md",
				children: `
					<div class="flex flex-col md:flex-row gap-10">
						<div class="flex flex-col items-center gap-4 min-w-[200px]">
							<div class="relative w-48 h-48 rounded-full overflow-hidden border-4 ${avatarBorder} shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black group cursor-pointer">
								<img id="profile-img" src="${avatarSrc}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
								<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
									<span class="text-sm font-bold text-white uppercase tracking-wider">Trocar Foto</span>
								</div>
								<input type="file" id="upload-avatar" class="hidden" accept="image/*">
							</div>
							<p class="text-gray-400 text-sm bg-slate-800 px-3 py-1 rounded-full border border-white/5">
								Ranking Global: <span class="text-cyan-400 font-bold">#--</span>
							</p>
						</div>

						<div class="flex-1 w-full flex flex-col justify-between">
							<div>

								${Form({
									id: "form-profile",
									children: `
										<label class="block text-sm text-gray-400 mb-2 ml-1">Nome de Exibição</label>
										${Input({
											id: "input-profile-nick",
											value: `${nick}`,
											className: "mb-8 bg-slate-800/50 border-white/10 focus:bg-black/60 text-lg"
										})}
									`
								})}

								<h3 class="text-lg text-white mb-4 font-bold flex items-center gap-2">
									<span class="w-1.5 h-6 bg-purple-500 rounded-full inline-block shadow-[0_0_10px_#a855f7]"></span>
									Estatísticas da Temporada
								</h3>

								<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
									${StatItem("Jogos", "stat-games")}
									${StatItem("Vitórias", "stat-wins", "text-green-400")}
									${StatItem("Derrotas", "stat-losses", "text-red-400")}
									${StatItem("Win Rate", "stat-wr", "text-cyan-400")}
								</div>
							</div>

							<div class="mt-8 flex justify-end pt-6 border-t border-white/5">
								${Button({
									id: "btn-profile-save",
									text: "Salvar Alterações",
									variant: "primary",
									className: "w-full md:w-auto md:px-12",
									attributes: 'type="submit" form="form-profile"',
								})}
							</div>
						</div>
					</div>
				`
			})}
		</div>
	`;
}

// --- LÓGICA ---
export function setupProfileEvents(navigate: (route: Route) => void) {

	// 1. Preencher Stats (Simulação por enquanto)
	// No futuro, isso virá do `state.user` ou de uma chamada `userService.getStats()`
	const elGames = document.getElementById('stat-games');
	const elWins = document.getElementById('stat-wins');
	const elLosses = document.getElementById('stat-losses');
	const elWr = document.getElementById('stat-wr');

	if (elGames) elGames.innerText = state.user?.score?.toString() || "0";
	if (elWins) elWins.innerText = "0"; // Placeholder
	if (elLosses) elLosses.innerText = "0"; // Placeholder
	if (elWr) elWr.innerText = "0%"; // Placeholder

	// 2. Botão Voltar
	document.getElementById('btn-profile-back')?.addEventListener('click', () => {
		navigate('dashboard');
	});

	// 3. Salvar Alterações
	const formUpdateProfile = document.getElementById('form-profile') as HTMLFormElement;
	formUpdateProfile?.addEventListener('submit', async (e) => {
		e.preventDefault();

		const nick = (document.getElementById('input-profile-nick') as HTMLInputElement)?.value;

		const formData = { nick };
		const validation = validateForm(nickSchema, formData);

		if (!validation.success) {
			showModal({
				title: "Nick inválido",
				message: "O nick deve ter entre 3 e 20 caracteres, contendo apenas letras, números e underscores.",
				type: "danger",
				confirmText: "OK"
			});
			return;
		}

		if (nick === state.user?.nick) {
			return ;
		}

		try {
			// await profileService.updateProfile(formData);

			// Atualizar estado global
			if (state.user) {
				state.user.nick = nick;
			}

			showModal({
				title: "Perfil atualizado!",
				message: "Nome de exibição atualizado com sucesso.",
				type: "success",
				confirmText: "OK"
			});
		} catch (error: any) {
			showModal({
				title: "Erro ao atualizar",
				message: error.message || "Não foi possível atualizar seu perfil.",
				type: "danger",
				confirmText: "Tentar novamente"
			});
		}
	});

	// 4. Upload de Avatar (Mock Visual)
	const profileImgContainer = document.querySelector('.group');
	const fileInput = document.getElementById('upload-avatar') as HTMLInputElement;

	if (profileImgContainer && fileInput) {
		profileImgContainer.addEventListener('click', () => {
			fileInput.click();
		});

		fileInput.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files[0]) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const img = document.getElementById('profile-img') as HTMLImageElement;
					if (img && e.target?.result) {
						img.src = e.target.result as string;
						// Aqui você enviaria a imagem para o backend
					}
				};
				reader.readAsDataURL(target.files[0]);
			}
		});
	}
}
