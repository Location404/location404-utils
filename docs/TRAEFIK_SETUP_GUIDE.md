# 🚀 Location404 - Traefik Setup Guide (HARDCODE EDITION)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Health Checks (.NET)](#health-checks-net)
6. [Redis Backplane (SignalR)](#redis-backplane-signalr)
7. [Deploy](#deploy)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Esta stack inclui:

- ✅ **Traefik** - Reverse Proxy + Load Balancer + SSL automático
- ✅ **2 réplicas** de cada serviço (mínimo para HA)
- ✅ **Sticky Sessions** para SignalR
- ✅ **Health Checks** em todos os serviços
- ✅ **LGTM Stack** completo:
  - **Loki** - Logs
  - **Grafana** - Visualização
  - **Tempo** - Distributed Tracing
  - **Mimir** - Métricas de longo prazo
  - **Prometheus** - Scraping de métricas
- ✅ **OpenTelemetry** em todos os backends
- ✅ **HTTPS** com Let's Encrypt
- ✅ **CORS** configurado
- ✅ **Observabilidade 360°**

---

## 🏗️ Arquitetura

```
                    ┌─────────────────┐
                    │   TRAEFIK       │
                    │  (Port 80/443)  │
                    │  + SSL/TLS      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────┐         ┌─────▼─────┐      ┌──────▼─────┐
    │  web   │         │   game    │      │    data    │
    │  (x2)  │         │   (x2)    │      │    (x2)    │
    └────────┘         └───────────┘      └────────────┘
                             │                    │
                       ┌─────▼─────┐      ┌───────▼──────┐
                       │   auth    │      │ PostgreSQL   │
                       │   (x2)    │      │  (VPS ext)   │
                       └───────────┘      └──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis/Dragon   │
                    │  (VPS externo)  │
                    └─────────────────┘

                    ┌─────────────────┐
                    │  OBSERVABILITY  │
                    ├─────────────────┤
                    │  • Prometheus   │
                    │  • Loki         │
                    │  • Tempo        │
                    │  • Mimir        │
                    │  • Grafana      │
                    └─────────────────┘
```

### Réplicas e Load Balancing

| Serviço | Réplicas | Sticky Session | Health Check |
|---------|----------|----------------|--------------|
| `location404-web` | 2 | ✅ Sim | `/` |
| `location404-game` | 2 | ✅ **SIM** (SignalR) | `/health` |
| `location404-auth` | 2 | ✅ Sim (cookies) | `/health` |
| `location404-data` | 2 | ❌ Não | `/health` |

---

## ⚙️ Pré-requisitos

### 1. Servidor/VPS
- **OS**: Ubuntu 20.04+ ou Debian 11+
- **RAM**: Mínimo 4GB (recomendado 8GB)
- **CPU**: Mínimo 2 cores (recomendado 4 cores)
- **Disco**: Mínimo 20GB SSD

### 2. Software
```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose
sudo apt install docker-compose-plugin
```

### 3. Serviços Externos (já rodando na sua VPS)
- ✅ PostgreSQL (Auth): `181.215.135.221:5432`
- ✅ PostgreSQL (Data): `181.215.135.221:5434`
- ✅ Dragonfly/Redis: `181.215.135.221:6379`
- ✅ RabbitMQ: `181.215.135.221:5672`

### 4. DNS (Produção)
Se estiver usando domínio real, configure os seguintes registros A:

```
location404.com            → IP_DO_SERVIDOR
www.location404.com        → IP_DO_SERVIDOR
auth.location404.com       → IP_DO_SERVIDOR
game.location404.com       → IP_DO_SERVIDOR
data.location404.com       → IP_DO_SERVIDOR
grafana.location404.com    → IP_DO_SERVIDOR
prometheus.location404.com → IP_DO_SERVIDOR
traefik.location404.com    → IP_DO_SERVIDOR
```

**Para desenvolvimento local**, adicione ao `/etc/hosts`:
```bash
sudo nano /etc/hosts

# Adicione:
127.0.0.1 location404.local www.location404.local
127.0.0.1 auth.location404.local
127.0.0.1 game.location404.local
127.0.0.1 data.location404.local
127.0.0.1 grafana.location404.local
127.0.0.1 prometheus.location404.local
127.0.0.1 traefik.location404.local
```

---

## 🔧 Instalação e Configuração

### Passo 1: Clonar o Repositório

```bash
cd /opt
git clone https://github.com/seu-usuario/location404.git
cd location404
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar com seus valores reais
nano .env
```

**Exemplo `.env` preenchido**:
```bash
DOMAIN=location404.com
ACME_EMAIL=admin@location404.com

GOOGLE_MAPS_API_KEY=AIzaSy...

POSTGRES_AUTH_CONNECTION=Host=181.215.135.221;Port=5432;Database=location404-useridentitydb-production;Username=location404;Password=SUA_SENHA_FORTE
POSTGRES_DATA_CONNECTION=Host=181.215.135.221;Port=5434;Database=geodataservice;Username=location404;Password=SUA_SENHA_FORTE

REDIS_CONNECTION_STRING=181.215.135.221:6379,password=SUA_SENHA_REDIS,ssl=false,abortConnect=false

RABBITMQ_HOST=181.215.135.221
RABBITMQ_PORT=5672
RABBITMQ_USER=location404
RABBITMQ_PASSWORD=SUA_SENHA_RABBITMQ

# IMPORTANTE: Gere uma chave forte!
JWT_SIGNING_KEY=$(openssl rand -base64 48)

GRAFANA_USER=admin
GRAFANA_PASSWORD=SenhaForteGrafana123
```

### Passo 3: Criar Diretórios Necessários

```bash
mkdir -p traefik/logs
mkdir -p observability/grafana/{provisioning/{datasources,dashboards},dashboards}
chmod -R 755 observability
```

---

## 🏥 Health Checks (.NET)

Os backends .NET precisam de endpoints `/health` para o Traefik verificar se estão saudáveis.

### Implementação

#### 1. **location404-game**

Edite `src/Location404.Game.API/Program.cs`:

```csharp
using Location404.Game.API.Hubs;
using Location404.Game.Infrastructure.Extensions;
using Shared.Observability.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSignalR();

// ✅ ADICIONAR HEALTH CHECKS
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy())
    .AddRedis(builder.Configuration["Redis:ConnectionString"] ?? throw new InvalidOperationException("Redis connection string not configured"),
              name: "redis",
              tags: new[] { "redis", "cache" })
    .AddRabbitMQ(rabbitConnectionString: $"amqp://{builder.Configuration["RabbitMQ:UserName"]}:{builder.Configuration["RabbitMQ:Password"]}@{builder.Configuration["RabbitMQ:HostName"]}:{builder.Configuration["RabbitMQ:Port"]}",
                 name: "rabbitmq",
                 tags: new[] { "rabbitmq", "messagebus" });

builder.Services.AddOpenTelemetryObservability(builder.Configuration, options =>
{
    options.Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:4200"]
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapOpenApi();
app.MapHub<GameHub>("/gamehub");

// ✅ MAPEAR HEALTH CHECK ENDPOINT
app.MapHealthChecks("/health");

app.Run();
```

**Adicionar pacote NuGet**:
```bash
cd location404-game/src/Location404.Game.API
dotnet add package AspNetCore.HealthChecks.Redis
dotnet add package AspNetCore.HealthChecks.RabbitMQ
```

#### 2. **location404-auth**

```csharp
// Em Program.cs, adicionar:
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy())
    .AddNpgSql(builder.Configuration.GetConnectionString("UserIdentityDatabaseProduction")!,
               name: "postgres",
               tags: new[] { "database", "postgresql" });

// ...

app.MapHealthChecks("/health");
```

**Adicionar pacote**:
```bash
cd location404-auth/src/Location404.Auth.API
dotnet add package AspNetCore.HealthChecks.Npgsql
```

#### 3. **location404-data**

```csharp
// Em Program.cs, adicionar:
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy())
    .AddNpgSql(builder.Configuration.GetConnectionString("GeoDataDatabase")!,
               name: "postgres",
               tags: new[] { "database", "postgresql" })
    .AddRabbitMQ(rabbitConnectionString: $"amqp://{builder.Configuration["RabbitMQ:UserName"]}:{builder.Configuration["RabbitMQ:Password"]}@{builder.Configuration["RabbitMQ:HostName"]}:{builder.Configuration["RabbitMQ:Port"]}",
                 name: "rabbitmq",
                 tags: new[] { "rabbitmq", "messagebus" });

// ...

app.MapHealthChecks("/health");
```

**Adicionar pacotes**:
```bash
cd location404-data/src/Location404.Data.API
dotnet add package AspNetCore.HealthChecks.Npgsql
dotnet add package AspNetCore.HealthChecks.RabbitMQ
```

---

## 🔄 Redis Backplane (SignalR)

Para múltiplas réplicas do `location404-game` funcionarem corretamente com SignalR, você precisa configurar o **Redis Backplane**.

### Por Que Precisa?

Sem backplane:
```
Cliente conectado no game-1 → Recebe mensagens apenas do game-1
Outro jogador conectado no game-2 → NÃO recebe mensagens do game-1
PROBLEMA: Match não funciona!
```

Com backplane:
```
Cliente no game-1 → Redis distribui → Todos recebem (game-1 E game-2)
```

### Implementação

#### 1. Adicionar Pacote NuGet

```bash
cd location404-game/src/Location404.Game.API
dotnet add package Microsoft.AspNetCore.SignalR.StackExchangeRedis
```

#### 2. Modificar `Program.cs`

```csharp
using Location404.Game.API.Hubs;
using Location404.Game.Infrastructure.Extensions;
using Shared.Observability.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

// ✅ ADICIONAR REDIS BACKPLANE
builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration["Redis:ConnectionString"]!, options =>
    {
        options.Configuration.ChannelPrefix = "location404:signalr";
    });

builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy())
    .AddRedis(builder.Configuration["Redis:ConnectionString"]!)
    .AddRabbitMQ(rabbitConnectionString: $"amqp://{builder.Configuration["RabbitMQ:UserName"]}:{builder.Configuration["RabbitMQ:Password"]}@{builder.Configuration["RabbitMQ:HostName"]}:{builder.Configuration["RabbitMQ:Port"]}");

builder.Services.AddOpenTelemetryObservability(builder.Configuration, options =>
{
    options.Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:4200"]
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapOpenApi();
app.MapHub<GameHub>("/gamehub");
app.MapHealthChecks("/health");

app.Run();
```

#### 3. Verificar Redis

No Redis, você deve ver:
```bash
# Conectar no Redis
redis-cli -h 181.215.135.221 -p 6379 -a SUA_SENHA

# Ver canais do SignalR
KEYS location404:signalr:*
```

---

## 🚀 Deploy

### Build das Imagens

```bash
# Navegar para o diretório raiz
cd /opt/location404

# Build de todos os serviços
docker compose -f docker-compose.traefik.yml build --no-cache
```

### Iniciar a Stack

```bash
# Iniciar TUDO
docker compose -f docker-compose.traefik.yml up -d

# Ver logs
docker compose -f docker-compose.traefik.yml logs -f

# Ver status
docker compose -f docker-compose.traefik.yml ps
```

### Verificar Serviços

```bash
# Traefik Dashboard
curl -k https://traefik.location404.local

# Health Checks
curl -k https://game.location404.local/health
curl -k https://auth.location404.local/health
curl -k https://data.location404.local/health

# Frontend
curl -k https://location404.local

# Grafana
curl -k https://grafana.location404.local
```

---

## 📊 Monitoramento

### Acessar Dashboards

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | https://location404.local | - |
| **Traefik Dashboard** | https://traefik.location404.local | - |
| **Grafana** | https://grafana.location404.local | admin / location404 |
| **Prometheus** | https://prometheus.location404.local | - |

### Grafana - Explorar Dados

#### 1. Logs (Loki)
```
Explore → Loki
Query: {service_name="location404-game"} |= "error"
```

#### 2. Métricas (Prometheus)
```
Explore → Prometheus
Query: rate(http_requests_total{service="location404-game"}[5m])
```

#### 3. Traces (Tempo)
```
Explore → Tempo
Search → Service Name: location404-game
```

### Queries Úteis

**Latência P95 do Game Service**:
```promql
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket{service="location404-game"}[5m])
)
```

**Taxa de Erro**:
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

**Matchmaking em andamento**:
```promql
matchmaking_queue_size
```

---

## 🔍 Troubleshooting

### 1. Container não inicia

```bash
# Ver logs completos
docker compose -f docker-compose.traefik.yml logs location404-game-1

# Verificar health check
docker inspect location404-game-1 | grep -A 20 Health
```

### 2. SignalR não conecta

**Verificar CORS**:
```bash
curl -I -X OPTIONS https://game.location404.local/gamehub \
  -H "Origin: https://location404.local" \
  -H "Access-Control-Request-Method: POST"
```

**Verificar Sticky Session**:
```bash
# Fazer 3 requests e ver o cookie
for i in {1..3}; do
  curl -I https://game.location404.local/health -c cookies.txt
  cat cookies.txt | grep location404_game_sticky
done
```

### 3. Health Check falhando

```bash
# Executar manualmente dentro do container
docker exec -it location404-game-1 wget --spider http://localhost:8080/health

# Ver response
docker exec -it location404-game-1 wget -O- http://localhost:8080/health
```

### 4. SSL não funciona

```bash
# Ver certificados gerados
docker exec location404-traefik cat /letsencrypt/acme.json

# Forçar renovação (staging)
docker compose -f docker-compose.traefik.yml restart traefik
```

### 5. Logs do Traefik

```bash
# Access logs
tail -f traefik/logs/access.log

# Ver rotas configuradas
curl http://localhost:8080/api/http/routers
```

---

## 🎯 Checklist de Produção

Antes de ir para produção:

- [ ] DNS configurado (A records)
- [ ] Firewall configurado (portas 80, 443 abertas)
- [ ] `.env` com valores de produção
- [ ] `JWT_SIGNING_KEY` forte (64+ chars)
- [ ] Senhas fortes em todos os serviços
- [ ] Health checks testados
- [ ] Redis backplane funcionando
- [ ] SSL/TLS funcionando (Let's Encrypt)
- [ ] Backups configurados (volumes Docker)
- [ ] Monitoramento configurado (alertas no Grafana)
- [ ] Load testing realizado
- [ ] Documentação atualizada

---

## 📈 Performance Tuning

### Ajustar Réplicas

```bash
# Aumentar réplicas do game (ex: 4 instâncias)
docker compose -f docker-compose.traefik.yml up -d --scale location404-game=4

# Traefik detecta automaticamente!
```

### Limites de Recursos

Adicione ao `docker-compose.traefik.yml`:

```yaml
location404-game-1:
  # ...
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

---

## 🎓 Para o TCC

### Métricas para Apresentar

1. **Latência média** por serviço (dashboard Grafana)
2. **Taxa de sucesso** (99.9% uptime)
3. **Tempo de resposta** do matchmaking
4. **Distribuição de carga** entre réplicas
5. **Traces distribuídos** (mostrar no Tempo)

### Demonstração ao Vivo

1. Abrir **Traefik Dashboard** → mostrar load balancing
2. Abrir **Grafana** → dashboard de overview
3. Simular **match** com 2 jogadores
4. Mostrar **trace** no Tempo (toda a requisição)
5. Mostrar **logs** no Loki (filtrando por matchId)
6. Derrubar 1 réplica → mostrar HA funcionando

---

## 📞 Suporte

Criado por: Location404 Team
TCC - 2025

**Documentação oficial**:
- Traefik: https://doc.traefik.io/traefik/
- Grafana LGTM: https://grafana.com/docs/
- OpenTelemetry: https://opentelemetry.io/docs/

---

**🔥 STACK HARDCODE COMPLETA! Boa sorte no TCC! 🚀**
