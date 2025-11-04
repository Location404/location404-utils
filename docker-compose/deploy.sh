#!/bin/bash

set -e

echo "🧹 Limpando stack antiga..."
docker stack rm location404 2>/dev/null || true

echo "⏳ Aguardando remoção completa (30 segundos)..."
sleep 30

echo "🗑️  Removendo redes antigas..."
docker network rm location404_location404 2>/dev/null || true
docker network rm location404_traefik-public 2>/dev/null || true

echo "🚀 Fazendo deploy da stack..."
docker stack deploy -c docker-compose.traefik.yml location404

echo "✅ Deploy concluído! Verificando serviços..."
sleep 5
docker service ls

echo ""
echo "📊 Para ver logs:"
echo "  docker service logs location404_web -f"
echo ""
echo "🔍 Para ver status detalhado:"
echo "  docker service ps location404_web"
