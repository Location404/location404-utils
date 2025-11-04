#!/bin/bash

set -e

echo "🔧 Configurando redes overlay para Docker Swarm..."

# Criar rede location404 se não existir
if ! docker network ls | grep -q location404; then
  echo "📡 Criando rede overlay 'location404'..."
  docker network create \
    --driver overlay \
    --attachable \
    --opt encrypted=true \
    location404
else
  echo "✅ Rede 'location404' já existe"
fi

# Criar rede traefik-public se não existir
if ! docker network ls | grep -q traefik-public; then
  echo "📡 Criando rede overlay 'traefik-public'..."
  docker network create \
    --driver overlay \
    --attachable \
    --opt encrypted=true \
    traefik-public
else
  echo "✅ Rede 'traefik-public' já existe"
fi

echo ""
echo "✅ Redes configuradas com sucesso!"
echo ""
echo "📋 Redes disponíveis:"
docker network ls | grep -E "NAME|location404|traefik-public"
echo ""
echo "🚀 Agora você pode fazer o deploy:"
echo "  docker stack deploy -c docker-compose.dokploy.yml location404"
