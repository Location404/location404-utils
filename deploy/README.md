# Location404 - Deploy

Configurações de deploy para produção do projeto Location404.

## Estrutura

```
deploy/
├── swarm-config/           # Docker Swarm stack
│   ├── stack.production.yml
│   ├── .env.production.example
│   └── .env.development.example
└── observability/          # Grafana standalone
    ├── docker-compose.yml
    ├── .env.example
    ├── provisioning/
    │   ├── datasources/
    │   └── dashboards/
    ├── dashboards/
    └── README.md
```

## Deploy do Stack Principal (Docker Swarm)

```bash
cd swarm-config/

# 1. Configurar variáveis de ambiente
cp .env.production.example .env.production
# Editar .env.production com suas credenciais

# 2. Deploy
docker stack deploy -c stack.production.yml location404-stack
```

## Deploy do Grafana (Docker Compose)

```bash
cd observability/

# 1. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 2. Deploy
docker-compose up -d
```

## Serviços

### Docker Swarm
- **Traefik**: Reverse proxy + Load balancer + SSL
- **location404-web**: Frontend Vue 3
- **location404-auth**: API de autenticação
- **location404-game**: Game engine (SignalR)
- **location404-data**: API de dados
- **RabbitMQ**: Message broker
- **Dragonfly**: Redis-compatible cache
- **Tempo**: Distributed tracing
- **Loki**: Logs aggregation
- **Mimir**: Metrics storage
- **Prometheus**: Metrics scraper

### Docker Compose (Standalone)
- **Grafana**: Visualização de observabilidade

## Comandos Úteis

### Docker Swarm
```bash
# Ver serviços
docker service ls

# Ver logs de um serviço
docker service logs -f <service-name>

# Atualizar stack
docker stack deploy -c stack.production.yml location404-stack

# Remover stack
docker stack rm location404-stack
```

### Docker Compose (Grafana)
```bash
# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Reiniciar
docker-compose restart
```
