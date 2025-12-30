Tela de perfil
	Arrumar estatísticas		THAIS DANI

JOGO:
	arrumar a personalização do jogo 	LEO

Front end
	Ao entrar na página e já tiver um token salvo 	DANI
		verificar se aquele token ainda está válido
		se não, apagar o token e ir para a tela de login

Back end
	Verificação de online		DANI
		Salvar o momento da última interação com o back end
		Na rota de listar um usuário falar se ele tá online baseado na última interação. 5 minutos fica logado.
		Tirar gameAvatar de tudo		DANI

Fazer componentes
	componente texto para cores baseado em gangues	DANI

Outras coisas
	Docker	CHRYS
	readme	CHRYS


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
