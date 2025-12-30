.PHONY: all up down logs clean fclean re install-local css-local dev-local build-local

# Variáveis de Diretórios
FRONT_DIR = Front
BACK_DIR = Back

# --- COMANDOS DOCKER (Principal) ---

# Sobe toda a aplicação (Frontend + Backend + Banco/Volumes)
all: up

# Constrói as imagens e sobe os containers em background
up:
	@echo "🐳 Subindo a aplicação com Docker Compose..."
	docker compose up --build -d
	@echo "✅ Aplicação rodando! Use 'make logs' para ver o output."

# Para e remove os containers
down:
	@echo "🛑 Parando a aplicação..."
	docker compose down

# Mostra os logs dos containers em tempo real
logs:
	docker compose logs -f

# --- COMANDOS DE LIMPEZA ---

# Para os containers
clean: down

# Limpeza total: remove containers, volumes (banco de dados), imagens criadas e node_modules locais
fclean: clean
	@echo "🗑️  Removendo volumes e imagens do Docker..."
	docker compose down -v --rmi all
	@echo "🧹 Limpando arquivos locais..."
	@rm -rf $(FRONT_DIR)/dist $(FRONT_DIR)/node_modules $(FRONT_DIR)/package-lock.json
	@rm -rf $(BACK_DIR)/node_modules $(BACK_DIR)/package-lock.json
	@rm -rf $(BACK_DIR)/dist

# Reinicia tudo do zero
re: fclean all

# --- COMANDOS LOCAIS (Caso queira rodar sem Docker) ---

# Instala dependências apenas do Front localmente
install-local:
	@cd $(FRONT_DIR) && npm install

# Gera o CSS localmente (útil para autocomplete do Tailwind)
css-local:
	@cd $(FRONT_DIR) && npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

# Roda o Front localmente (sem docker)
dev-local: install-local css-local
	@cd $(FRONT_DIR) && FRONT_PORT=8080 npm run dev

# Build de produção local
build-local: install-local
	@cd $(FRONT_DIR) && npm run build