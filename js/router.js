/*
 * Este é o nosso "Roteador" Vanilla JS.
 * Ele gerencia qual "view" (página) está ativa
 * usando a History API do navegador.
 */

// 1. Mapeia as "rotas" (URLs) para as IDs das nossas views no HTML
const routes = {
	'/': 'login-view',						// Página inicial é o login
	'/login': 'login-view',
	'/dashboard': 'dashboard-view',
	'/game': 'game-view'
};

// 2. Armazena as referências aos elementos das views
const views = {
	'login-view': document.getElementById('login-view'),
	'dashboard-view': document.getElementById('dashboard-view'),
	'game-view': document.getElementById('game-view')
};

// 3. Função para mostrar uma view e esconder todas as outras
function showView(viewId) {
	// Esconde todas as views
	for (const id in views) {
		views[id].classList.add('hidden');
	}

	// Mostra a view correta
	const view = views[viewId];
	if (view) {
		view.classList.remove('hidden');
	} else {
		// Se a rota não existir, volta ao login
		views['login-view'].classList.remove('hidden');
	}
}

// 4. Função principal de navegação (exportada)
export function navigateTo(path) {
	// Atualiza a URL na barra de endereços do navegador
	window.history.pushState(null, null, path);
	// Chama o 'handleRoute' para mostrar a view correta
	handleRoute();
}

// 5. O "cérebro" do roteador: decide qual view mostrar
function handleRoute() {
	const path = window.location.pathname;
	const viewId = routes[path] || 'login-view'; // Se a rota não existir, vai pro login
	showView(viewId);

	// Dispara um evento customizado para avisar o main.js que a rota mudou.
	const event = new CustomEvent('routeChange', { detail: { viewId } });
	document.dispatchEvent(event);
}

// 6. Configura os listeners
// Ouve o evento 'popstate' (clique nos botões "voltar" e "avançar" do navegador)
window.addEventListener('popstate', handleRoute);

// Ouve o carregamento inicial da página
document.addEventListener('DOMContentLoaded', () => {
	// Mostra a view correta no carregamento inicial
	handleRoute();
});
