import { state } from "@/main";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const backgroundByGang = {
	potatoes: "src/assets/bg-login-potatoes.png",
	tomatoes: "src/assets/bg-login-tomatoes.png"
};

export function get2FADisableHtml() {
	const gang = state.user?.gang || "potatoes";
	const backgroundImage = backgroundByGang[gang];

	return `
		<img src="${backgroundImage}" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />

		<div class="min-h-screen flex justify-center items-center p-5">
			${Card({
				className: "max-w-md w-full text-center",
				children: `
					<h2 class="text-red-500 mb-4 text-3xl font-bold">
						Desativar 2FA
					</h2>

					<p class="text-gray-300 text-md mb-6">
						Para sua segurança, confirme sua senha para desativar a autenticação em duas etapas.
					</p>

					${Input({
						id: "input-2fa-disable-password",
						type: "password",
						placeholder: "Digite sua senha",
						className: "mb-6"
					})}

                    ${Input({
                        id: "input-2fa-disable-token",
                        placeholder: "000 000",
                        className: "text-center tracking-[0.5em] font-mono mb-6"
                    })}

                    ${Button({
						id: "btn-2fa-disable-confirm",
						text: "Desativar 2FA",
						variant: "danger"
					})}

					${Button({
						id: "btn-2fa-disable-cancel",
						text: "Cancelar",
						variant: "ghost",
						className: "mt-4 text-sm"
					})}
				`
			})}
		</div>
	`;
}
