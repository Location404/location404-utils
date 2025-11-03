# 🚀 Location404 - Quick Start

## ⚡ Início Rápido (5 minutos)

### 1. Configurar Variáveis

```bash
cp .env.example .env
nano .env
```

Preencha pelo menos:
- `GOOGLE_MAPS_API_KEY`
- `POSTGRES_AUTH_CONNECTION`
- `POSTGRES_DATA_CONNECTION`
- `REDIS_CONNECTION_STRING`
- `RABBITMQ_HOST`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`
- `JWT_SIGNING_KEY` (gere com: `openssl rand -base64 48`)

### 2. Configurar DNS/Hosts

**Desenvolvimento local**:
```bash
sudo nano /etc/hosts

# Adicione:
127.0.0.1 location404.local auth.location404.local game.location404.local data.location404.local grafana.location404.local prometheus.location404.local traefik.location404.local
```

### 3. Implementar Health Checks

Siga as instruções em `TRAEFIK_SETUP_GUIDE.md` seção "Health Checks (.NET)" para adicionar endpoints `/health` em cada backend.

### 4. Implementar Redis Backplane

Siga as instruções em `TRAEFIK_SETUP_GUIDE.md` seção "Redis Backplane (SignalR)" para configurar SignalR com múltiplas réplicas.

### 5. Build e Deploy

```bash
# Build
docker compose -f docker-compose.traefik.yml build

# Iniciar
docker compose -f docker-compose.traefik.yml up -d

# Ver logs
docker compose -f docker-compose.traefik.yml logs -f
```

### 6. Acessar Aplicação

- **Frontend**: https://location404.local
- **Traefik**: https://traefik.location404.local
- **Grafana**: https://grafana.location404.local (admin/location404)

## 📊 Stack Completa

### Serviços de Aplicação
- ✅ 2x Frontend (Vue 3)
- ✅ 2x Game Engine (SignalR + Redis Backplane)
- ✅ 2x Auth Service (JWT)
- ✅ 2x Data Service (PostgreSQL)

### Infraestrutura
- ✅ Traefik (Load Balancer + SSL)
- ✅ Prometheus (Métricas)
- ✅ Loki (Logs)
- ✅ Tempo (Traces)
- ✅ Mimir (Long-term metrics)
- ✅ Grafana (Visualização)

### URLs dos Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | https://location404.local | Aplicação principal |
| Game API | https://game.location404.local | SignalR Hub |
| Auth API | https://auth.location404.local | Autenticação JWT |
| Data API | https://data.location404.local | Localizações e Stats |
| Traefik | https://traefik.location404.local | Dashboard do proxy |
| Grafana | https://grafana.location404.local | Observabilidade |
| Prometheus | https://prometheus.location404.local | Métricas raw |

## 🔍 Verificar Status

```bash
# Ver todos os containers
docker compose -f docker-compose.traefik.yml ps

# Ver logs de um serviço específico
docker compose -f docker-compose.traefik.yml logs -f location404-game-1

# Testar health checks
curl -k https://game.location404.local/health
curl -k https://auth.location404.local/health
curl -k https://data.location404.local/health

# Ver métricas Traefik
curl http://localhost:8080/metrics
```

## 🛑 Parar Tudo

```bash
docker compose -f docker-compose.traefik.yml down
```

## 🔥 Reset Completo (CUIDADO!)

```bash
# Para tudo e remove volumes
docker compose -f docker-compose.traefik.yml down -v

# Remove imagens
docker compose -f docker-compose.traefik.yml down --rmi all
```

## 📖 Documentação Completa

Leia `TRAEFIK_SETUP_GUIDE.md` para:
- Configuração detalhada
- Health Checks implementation
- Redis Backplane setup
- Troubleshooting
- Performance tuning
- Produção deployment

## 🎯 Para o TCC

### Demonstração Sugerida

1. **Abrir Traefik Dashboard** → Mostrar rotas e load balancing
2. **Abrir Grafana** → Dashboard de overview com métricas ao vivo
3. **Jogar uma partida** → 2 jogadores
4. **Mostrar no Grafana**:
   - Logs da partida (Loki)
   - Métricas de latência (Prometheus)
   - Trace distribuído (Tempo)
5. **Simular falha** → Parar 1 réplica do game
6. **Mostrar HA** → Aplicação continua funcionando!

### Métricas para Apresentar

Execute load test e capture:
- ✅ Latência P95 < 200ms
- ✅ Taxa de erro < 0.1%
- ✅ Throughput (requests/sec)
- ✅ Tempo de matchmaking médio
- ✅ Uptime 99.9%

---

**Dúvidas?** Leia a documentação completa em `TRAEFIK_SETUP_GUIDE.md`

**HARDCODE COMPLETO! 🔥🚀**
