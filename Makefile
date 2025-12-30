.PHONY: all up down logs clean fclean re install-local css-local dev-local build-local

FRONT_DIR = Front
BACK_DIR = Back

all: up

up:
	@echo "🐳 Subindo a aplicação com Docker Compose..."
	docker compose up --build -d
	@echo "✅ Aplicação rodando! Use 'make logs' para ver o output."

down:
	@echo "🛑 Parando a aplicação..."
	docker compose down

logs:
	docker compose logs -f

clean: down

fclean: clean
	@echo "🗑️  Removendo volumes e imagens do Docker..."
	docker compose down -v --rmi all
	@echo "🧹 Limpando arquivos locais..."
	@rm -rf $(FRONT_DIR)/dist $(FRONT_DIR)/node_modules $(FRONT_DIR)/package-lock.json
	@rm -rf $(BACK_DIR)/node_modules $(BACK_DIR)/package-lock.json
	@rm -rf $(BACK_DIR)/dist

re: fclean all

install-local:
	@cd $(FRONT_DIR) && npm install

css-local:
	@cd $(FRONT_DIR) && npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

dev-local: install-local css-local
	@cd $(FRONT_DIR) && FRONT_PORT=8080 npm run dev

build-local: install-local
	@cd $(FRONT_DIR) && npm run build
