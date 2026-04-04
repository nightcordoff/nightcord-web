.PHONY: help install front back dev build python check-linux-node docker-build docker-up docker-down

SHELL := /bin/bash

check-linux-node:
	@npm_path="$$(command -v npm || true)"; \
	if [[ -z "$$npm_path" ]]; then \
		printf "npm not found in this shell.\n"; \
		exit 1; \
	fi; \
	if [[ "$$npm_path" == /mnt/c/* ]]; then \
		printf "Windows npm detected from WSL: %s\n" "$$npm_path"; \
		printf "Install Node inside WSL, then retry.\n"; \
		printf "Example: sudo apt update && sudo apt install -y nodejs npm\n"; \
		exit 1; \
	fi

help:
	@printf "Nightcord commands\n\n"
	@printf "  make install  Install root/front/back npm dependencies\n"
	@printf "  make front    Start React/Vite front-end on port 4173\n"
	@printf "  make back     Start TypeScript back-end on port 3001\n"
	@printf "  make dev      Start front-end and back-end together\n"
	@printf "  make build    Build front-end and back-end\n"
	@printf "  make python   Start the current Python runtime on port 4173\n"
	@printf "  make docker-build  Build Docker images\n"
	@printf "  make docker-up     Start Docker stack\n"
	@printf "  make docker-down   Stop Docker stack\n"

install: check-linux-node
	npm install
	cd front-end && npm install
	cd back-end && npm install

front: check-linux-node
	npm run dev:front

back: check-linux-node
	npm run dev:back

dev: check-linux-node
	npm run dev

build: check-linux-node
	npm run build

python:
	python3 back-end/server.py

docker-build:
	docker-compose build

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down