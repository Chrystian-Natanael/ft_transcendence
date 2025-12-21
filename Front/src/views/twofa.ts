import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { state } from "@/main";

const backgroundByGang = {
	potatoes: 'src/assets/bg-login-potatoes.png',
	tomatoes: 'src/assets/bg-login-tomatoes.png',
};

export function get2FAHtml(data: {
	qrCodeUrl: string;
	secret: string;
}) {
	const user = state.user;
	const gang = user?.gang || 'potatoes';
	const isPotato = gang === 'potatoes';

	const titleColor = isPotato ? 'text-yellow-400' : 'text-red-400';
	const titleGlow = isPotato
		? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]'
		: 'drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]';

	const cardBorder = isPotato ? 'border-yellow-500/30' : 'border-red-500/30';
	const cardShadow = isPotato
		? 'shadow-[0_0_20px_rgba(234,179,8,0.15)]'
		: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]';

	const backgroundImage = backgroundByGang[gang];

	return `
		<img 
			src="${backgroundImage}"
			class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30"
		/>

		<div class="min-h-screen flex justify-center items-center p-5">

			${Card({
				className: `
					max-w-md w-full text-center
					bg-slate-900/40 backdrop-blur-md
					border ${cardBorder}
					${cardShadow}
				`,
				children: `
					<h2 class="${titleColor} ${titleGlow} mb-4 text-4xl font-bold">
						Ativar 2FA
					</h2>

					<p class="text-gray-400 text-sm mb-6">
						Escaneie o QR Code com seu aplicativo autenticador
						e confirme com o código gerado.
					</p>

					<!-- QR CODE -->
					<div class="flex justify-center mb-6">
						<img
							src="${data.qrCodeUrl}"
							alt="QR Code 2FA"
							class="w-40 h-40 bg-white p-2 rounded-lg shadow-md"
						/>
					</div>

					<!-- SECRET -->
					<div class="mb-6 text-left">
						<label class="text-xs text-gray-400 font-bold uppercase mb-1 block">
							Secret
						</label>
						<div class="flex items-center gap-2">
							<input
								id="input-2fa-secret"
								type="text"
								readonly
								value="${data.secret}"
								class="flex-1 bg-slate-800/80 text-gray-300 text-sm font-mono px-3 py-2 rounded border border-white/10"
							/>
							<button
								id="btn-2fa-copy"
								class="text-cyan-400 hover:text-cyan-300 text-sm"
								title="Copiar secret"
							>📋</button>
						</div>
					</div>

					<!-- TOKEN -->
					<div class="mb-6">
						<label class="text-xs text-gray-400 font-bold uppercase mb-1 block">
							Código do autenticador
						</label>
						${Input({
							id: "input-2fa-code",
							placeholder: "000 000",
							className: `
								text-center text-3xl tracking-[0.5em] font-mono
								bg-slate-800/80 border border-white/10
								focus:border-cyan-500
								focus:shadow-[0_0_10px_rgba(6,182,212,0.4)]
								py-4
							`
						})}
					</div>

					${Button({
						id: "btn-2fa-send",
						text: "Ativar 2FA",
						variant: "primary"
					})}

					${Button({
						id: "btn-2fa-back",
						text: "Cancelar",
						variant: "ghost",
						className: "mt-4 text-sm"
					})}
				`
			})}
		</div>
	`;
}