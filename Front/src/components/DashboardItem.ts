import { cn } from "@/utils/cn";

interface DashItensProps {
	id: string;
	title: string;
	subtitle: string;
	icon: string;
	colorTheme?: "purple" | "indigo" | "green" | "blue" | "gray" | "yellow" | "red";
}

const themes = {
	purple:	"border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
	indigo:	"border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]",
	green:	"border-green-500 text-green-400 hover:bg-green-500/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]",
	blue:	"border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]",
	gray:	"border-slate-500 text-slate-400 hover:bg-slate-500/10",
	yellow:	"border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]",
	red:	"border-red-500 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
};

export function DashboardItem({id, title, subtitle, icon, colorTheme= "gray"}:DashItensProps) {
	return `
		<div id="${id}" class="${cn("group cursor-pointer bg-slate-900/60 border-l-4 p-6 rounded-r-xl shadow-lg transition-all duration-300 hover:translate-x-1", themes[colorTheme])}">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="text-2xl font-bold text-white group-hover:text-white mb-1">${title}</h3>
					<p class="text-gray-400 text-sm group-hover:text-gray-300">${subtitle}</p>
				</div>
				<div class="text-3xl font-bold opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-transform">
					${icon}
				</div>
			</div>
		</div>
	`;
}
