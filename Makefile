.PHONY: all install build dev serve clean fclean re css

FRONT_DIR = Front

all: install css build

install:
	@cd $(FRONT_DIR) && npm install

css:
	@cd $(FRONT_DIR) && npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

css-watch:
	@cd $(FRONT_DIR) && npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch

build:
	@cd $(FRONT_DIR) && npx tsc

dev:
	@cd $(FRONT_DIR) && npx tsc --watch & cd $(FRONT_DIR) && npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch

serve: css build
	@cd $(FRONT_DIR) && npx http-server . -p 8080

run: css build
	@cd $(FRONT_DIR) && npx http-server . -p 8080 -o

clean:
	@cd $(FRONT_DIR) && rm -rf dist

fclean: clean
	@cd $(FRONT_DIR) && rm -rf node_modules package-lock.json

re: fclean all
