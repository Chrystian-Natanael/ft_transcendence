.PHONY: all install build dev serve clean fclean re

all: install build

install:
	@npm install

build:
	@npx tsc

dev:
	@npx tsc --watch

serve: build
	@npx http-server . -p 8080

run: build
	@npx http-server . -p 8080 -o

clean:
	@rm -rf dist

fclean: clean
	@rm -rf node_modules package-lock.json

re: fclean all
