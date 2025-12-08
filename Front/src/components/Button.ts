import { cn } from "@/utils/cn";

interface ButtonProps {
	id?: string;
	text: string;
	type?: "button" | "submit";
	variant?: "primary" | "secondary" | "danger" | "ghost";
	theme?: "potatoes" | "tomatoes" | "default";
	className?: string;
	onClick?: string;
}

const baseStyles =
	"w-full py-3 px-6 rounded-xl font-bold transition-all " +
	"duration-300 cursor-pointer text-center block shadow-lg";

const variantsDefault = {
	primary: "bg-cyan-500 text-black hover:bg-cyan-400 active:bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]",
	secondary: "bg-transparent text-cyan-500 border border-cyan-500 hover:bg-cyan-500/10 active:bg-cyan-700/10 shadow-none",
	danger: "bg-transparent text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white active:bg-rose-700 active:text-white",
	ghost: "bg-transparent text-gray-400 hover:text-red-400 shadow-none hover:bg-red-500/5 active:bg-red-500/10"
};

const variantPotatoes = {
	primary: "bg-yellow-500 text-black hover:bg-yellow-400 active:bg-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]",
	secondary: "bg-transparent text-yellow-500 border border-yellow-500 hover:bg-yellow-500/10 active:bg-yellow-700/10 shadow-none",
	danger: "bg-transparent text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white active:bg-rose-700 active:text-white",
	ghost: "bg-transparent text-gray-400 hover:text-red-400 shadow-none hover:bg-red-500/5 active:bg-red-500/10"
};

const variantTomatoes = {
	primary: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]",
	secondary: "bg-transparent text-red-600 border border-red-600 hover:bg-red-600/10 active:bg-red-700/10 shadow-none",
	danger: "bg-transparent text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white active:bg-rose-700 active:text-white",
	ghost: "bg-transparent text-gray-400 hover:text-red-400 shadow-none hover:bg-red-500/5 active:bg-red-500/10"
};

export function Button({ id = "", text, variant = "primary", theme = "default", className }: ButtonProps) {

	let variantTheme;

	if (theme === 'default')
		variantTheme = variantsDefault;
	else if (theme === 'potatoes')
		variantTheme = variantPotatoes;
	else
		variantTheme = variantTomatoes;

	return `
		<button
			${id ? `id="${id}"` : ""}
			class="${cn(baseStyles, variantTheme[variant], className)}"
		>
			${text}
		</button>
	`
}
