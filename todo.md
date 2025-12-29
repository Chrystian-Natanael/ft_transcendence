Tela de perfil
	Arrumar estatísticas

JOGO:
	arrumar o lag
	arrumar a personalização do jogo
	verificar esquemas de pontuação do fim da partida.
	Encerrar o jogo de ambos quando um se desconectar
	Retirar o botão de jogar novamente

Front end
	Ao entrar na página e já tiver um token salvo 
		verificar se aquele token ainda está válido
		se não, apagar o token e ir para a tela de login
	
	Arrumar caps lock como input dos movimentos

Back end
	Verificação de online
		Salvar o momento da última interação com o back end
		Na rota de listar um usuário falar se ele tá online baseado na última interação. 5 minutos fica logado.
	Fazer a foto de perfil

Fazer componentes
	componente texto para cores baseado em gangues

Outras coisas
	Docker
	readme

Rotas /game testar:
	/casual/invite - Rota que invita um AMIGO para um jogo e te redireciona para a tela de aguardando oponente
	/casual/response - Envia uma resposta (accept, decline ) para um convite de jogo (nick)
	



BANCO DE DADOS:

TABELAS:
	player
		int pk	| id
		VARCHAR	| nome
		VARCHAR	| nick
		VARCHAR	| email
		VARCHAR	| senha
		bool	| isAnonymous 
		date	| last_activity
		VARCHAR	| gangue
		bool	| two factor enabled
		VARCHAR	| two factor secret
		int		| score
		bool	| is_online
		VARCHAR	| avatar
		VARCHAR	| game avatar
	
	backup code
		int pk	| id
		int	fk	| id_player
		int 	| code

	amigos
		int pk | id
		int fk | id_player_1
		int fk | id_player_2

	friends send
		int pk	| id
		int fk	| id_player_sender -> fk
		int fk	| id_player_receiver -> fk


Relacionamentos
	player - player -> amigos				n:n
	player - player -> requests				n:n
	player - backup code -> backup codes	1:n
