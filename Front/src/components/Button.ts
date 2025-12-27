import { cn } from "@/utils/cn";
import { Icon } from "./Icon";

interface ButtonProps {
	id: string;
	text?: string;
	title?: string;
	type?: "button" | "submit";
	variant?: "primary" | "secondary" | "danger" | "ghost";
	theme?: "potatoes" | "tomatoes" | "default";
	icon?: "check" | "x" | "trash" | "arrowLeft" | "heart" | "users";
	className?: string;
	attributes?: string;
	onClick?: string;
}

const baseStyles =
	"w-full py-3 px-6 rounded-xl font-bold transition-all " +
	"duration-300 cursor-pointer text-center block shadow-lg";

const variantsDefault = {
	primary: "bg-cyan-500 text-black hover:bg-cyan-400 active:bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]",
	secondary: "bg-transparent text-cyan-500 border border-cyan-500 hover:bg-cyan-500/10 active:bg-cyan-700/10 shadow-none",
	danger: "bg-transparent text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white active:bg-rose-700 active:text-white",
	ghost: "bg-transparent text-gray-400 hover:text-white shadow-none hover:bg-white/10 active:bg-white/20"
};

const variantPotatoes = {
	primary: "bg-yellow-500 text-black hover:bg-yellow-400 active:bg-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]",
	secondary: "bg-transparent text-yellow-500 border border-yellow-500 hover:bg-yellow-500/10 active:bg-yellow-700/10 shadow-none",
	danger: "bg-transparent text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white active:bg-rose-700 active:text-white",
	ghost: "bg-transparent text-gray-400 hover:text-white shadow-none hover:bg-white/10 active:bg-white/20"
};

const variantTomatoes = {
	primary: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]",
	secondary: "bg-transparent text-red-600 border border-red-600 hover:bg-red-600/10 active:bg-red-700/10 shadow-none",
	danger: "bg-transparent text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white active:bg-rose-700 active:text-white",
	ghost: "bg-transparent text-gray-400 hover:text-white shadow-none hover:bg-white/10 active:bg-white/20"
};

export function Button({
	id = "",
	text = "",
	title = "",
	variant = "primary",
	theme = "default",
	icon = undefined,
	className,
	attributes
}: ButtonProps) {

	let variantTheme;

	if (theme === 'default')
		variantTheme = variantsDefault;
	else if (theme === 'potatoes')
		variantTheme = variantPotatoes;
	else
		variantTheme = variantTomatoes;

	if (icon) {
		return `
		<button
			${id ? `id="${id}"` : ""}
			${title ? `title="${title}"` : ""}
			class="${cn(baseStyles, variantTheme[variant], className)} flex items-center justify-center gap-2"
			${attributes}
		>
			${Icon({
				name: icon,
				size: "md",
			})}
		</button>
	`
	}

	return `
		<button
			${id ? `id="${id}"` : ""}
			${title ? `title="${title}"` : ""}
			class="${cn(baseStyles, variantTheme[variant], className)}"
			${attributes}
		>
			${text}
		</button>
	`
}
