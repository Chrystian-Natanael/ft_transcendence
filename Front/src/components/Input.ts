import { cn } from '@/utils/cn';

interface InputProps {
	id: string;
	type?: "text" | "password" | "email" | "number";
	placeholder?: string;
	value?: string;
	className?: string;
	theme?: "default" | "potatoes" | "tomatoes";
	attributes?: string;
}

const baseStyles =
	"w-full px-4 py-3 rounded-xl text-lg bg-black/40 text-white placeholder-gray-500 outline-none transition";

const themeDefault = {
	border: "border border-cyan-500/50",
	focus: "focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]",
};

const themePotatoes = {
	border: "border border-yellow-500/50",
	focus: "focus:border-yellow-400 focus:shadow-[0_0_10px_rgba(234,179,8,0.18)]",
};

const themeTomatoes = {
	border: "border border-red-500/50",
	focus: "focus:border-red-400 focus:shadow-[0_0_10px_rgba(220,38,38,0.18)]",
};

export function Input({ id, type = "text", placeholder = "", value = "", className, theme = 'default', attributes}: InputProps) {
	let themeObj = themeDefault;
	if (theme === 'potatoes') themeObj = themePotatoes;
	else if (theme === 'tomatoes') themeObj = themeTomatoes;

	const classList = cn(baseStyles, themeObj.border, themeObj.focus, className);

	return `
		<input
			id="${id}"
			type="${type}"
			placeholder="${placeholder}"
			value="${value}"
			class="${classList}"
			${attributes}
		>
	`;
}
