/*
 * Este arquivo guarda o "estado global" da aplicação.
 * Por enquanto, é bem simples.
 */

const AppState = {
	// Para o login anônimo, podemos deixar 'null' ou 'visitante'
	currentUser: null,

	// O histórico de partidas da sessão
	matchHistory: []
};

export default AppState;
