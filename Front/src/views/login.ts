import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";

export function getLoginHtml() {
	return `
		<img src="src/assets/bg-login.png" alt="Background" class="fixed inset-0 w-full h-full object-cover -z-10 opacity-30" />
		<div class="min-h-screen flex justify-center items-center p-5">

			${Card({
				className: "max-w-md w-full text-center",
				children: `

					<h2 class="text-cyan-500 mb-4 text-5xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
						<div class="text-yellow-400">
							POTATOES
						</div>
						vs
						<div class="text-red-400">
							TOMATOES
						</div>
					</h2>

					${Button({
						id: "btn-register",
						text: "Criar Conta",
						variant: "secondary",
						theme: "potatoes",
						className: "mb-6"
					})}

					<div class="space-y-4 text-left">
						<div>
							<label class="block text-sm text-gray-400 mb-1 ml-1">Login</label>
							${Input({
								id: "input-login-user",
								placeholder: "Seu usuário ou email",
							})}
						</div>

						<div>
							<label class="block text-sm text-gray-400 mb-1 ml-1">Senha</label>
							${Input({
								id: "input-login-pass",
								type: "password",
								placeholder: "••••••"
							})}
						</div>
					</div>

					${Button({
						id: "btn-login-user",
						text: "Entrar",
						variant: "primary",
						theme: "potatoes",
						className: "mt-8"
					})}

					<div class="mt-6 border-t border-white/10 pt-6" />

					<div class="space-y-4">
						${Input({
							id: "input-login-guest",
							placeholder: "Seu usuário",
						})}

						${Button({
							id: "btn-login-guest",
							text: "Entrar como Visitante",
							variant: "ghost",
							className: "text-sm underline decoration-transparent hover:decoration-white"
						})}
					</div>

				`
			})}

		</div>
	`
}
