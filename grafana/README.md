# Grafana - Location404

Grafana standalone para visualização de observabilidade do projeto Location404.

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

2. Edite o `.env` com suas credenciais:
```bash
GRAFANA_USER=admin
GRAFANA_PASSWORD=sua_senha_segura
GRAFANA_ROOT_URL=https://grafana.seudominio.com
```

## Deploy

### Desenvolvimento (Local)
```bash
docker-compose up -d
```

### Produção (VPS)
```bash
# Garantir que está na mesma rede do stack principal
docker-compose up -d
```

## Acesso

- URL: http://localhost:3000 (desenvolvimento) ou conforme GRAFANA_ROOT_URL (produção)
- Usuário: conforme GRAFANA_USER (padrão: admin)
- Senha: conforme GRAFANA_PASSWORD (padrão: location404)

## Datasources Pré-configurados

O Grafana já vem com os seguintes datasources configurados automaticamente:

- **Tempo**: Distributed tracing (http://tempo:3200)
- **Loki**: Logs aggregation (http://loki:3100)
- **Prometheus**: Metrics (http://prometheus:9090) - Default
- **Mimir**: Metrics storage (http://mimir:9009/prometheus)

## Dashboards

Coloque seus dashboards JSON na pasta `dashboards/` e eles serão carregados automaticamente.

## Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Atualizar imagem
docker-compose pull
docker-compose up -d
```
