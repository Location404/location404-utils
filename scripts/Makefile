.PHONY: help dev dev-auth dev-game dev-data dev-web stop clean build restore

help:
	@echo "Location404 - Makefile Commands"
	@echo ""
	@echo "  make dev          - Roda todos os 4 serviços em paralelo"
	@echo "  make dev-auth     - Roda apenas o Auth Service"
	@echo "  make dev-game     - Roda apenas o Game Service"
	@echo "  make dev-data     - Roda apenas o Data Service"
	@echo "  make dev-web      - Roda apenas o Frontend (Vue)"
	@echo "  make build        - Build todos os projetos backend"
	@echo "  make restore      - Restore dependencies de todos os projetos"
	@echo "  make clean        - Limpa builds anteriores"
	@echo "  make stop         - Para todos os processos rodando"

dev:
	@echo "🚀 Iniciando todos os serviços..."
	@make -j4 dev-auth dev-game dev-data dev-web

dev-auth:
	@echo "🔐 Iniciando Auth Service..."
	@cd location404-auth/src/Location404.Auth.API && dotnet run

dev-game:
	@echo "🎮 Iniciando Game Service..."
	@cd location404-game/src/Location404.Game.API && dotnet run

dev-data:
	@echo "📊 Iniciando Data Service..."
	@cd location404-data/src/Location404.Data.API && dotnet run

dev-web:
	@echo "🌐 Iniciando Frontend..."
	@cd location404-web && npm run dev

build:
	@echo "🔨 Building Auth Service..."
	@cd location404-auth && dotnet build
	@echo "🔨 Building Game Service..."
	@cd location404-game && dotnet build
	@echo "🔨 Building Data Service..."
	@cd location404-data && dotnet build
	@echo "🔨 Building Frontend..."
	@cd location404-web && npm run build

restore:
	@echo "📦 Restoring Auth Service..."
	@cd location404-auth && dotnet restore
	@echo "📦 Restoring Game Service..."
	@cd location404-game && dotnet restore
	@echo "📦 Restoring Data Service..."
	@cd location404-data && dotnet restore
	@echo "📦 Installing Frontend dependencies..."
	@cd location404-web && npm install

clean:
	@echo "🧹 Limpando builds..."
	@cd location404-auth && dotnet clean
	@cd location404-game && dotnet clean
	@cd location404-data && dotnet clean
	@cd location404-web && rm -rf dist node_modules/.vite
	@echo "✅ Limpeza concluída"

stop:
	@echo "🛑 Parando todos os processos..."
	@pkill -f "dotnet run" || true
	@pkill -f "vite" || true
	@echo "✅ Processos parados"
