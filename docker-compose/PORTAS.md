# Portas Configuradas - Location404

## Portas alteradas para evitar conflitos com Dokploy

### Serviços Principais (via Traefik - HTTPS):
- **Frontend**: https://location404.com.br
- **Game API**: https://game.location404.com.br
- **Auth API**: https://auth.location404.com.br
- **Data API**: https://data.location404.com.br

### Dashboards e Monitoramento:

| Serviço | Porta Original | Nova Porta | URL Direta | URL via Traefik |
|---------|----------------|------------|------------|-----------------|
| **Traefik Dashboard** | 8080 | **8888** | http://seu-ip:8888 | https://traefik.location404.com.br |
| **Grafana** | 3000 | **13000** | http://seu-ip:13000 | https://grafana.location404.com.br |
| **Prometheus** | 9090 | **19090** | http://seu-ip:19090 | https://prometheus.location404.com.br |
| **Tempo** | 3200 | **13200** | http://seu-ip:13200 | - |
| **Loki** | 3100 | **13100** | http://seu-ip:13100 | - |
| **Mimir** | 9009 | **19009** | http://seu-ip:19009 | - |

### Portas Internas (não expostas):
- OTLP gRPC: 4317 → **14317**
- OTLP HTTP: 4318 → **14318**

### Portas que NÃO mudaram (críticas):
- **HTTP**: 80 (redirecionamento para HTTPS)
- **HTTPS**: 443 (tráfego principal)

---

## Motivo das mudanças:

- **3000**: Conflito com Dokploy
- **8080**: Possível conflito com outras ferramentas
- **9090, 9009**: Portas comuns que podem conflitar

## Padrão de numeração:

- **1xxxx**: Portas de observabilidade (13000, 13100, 13200, 14317, etc)
- **19xxx**: Portas de métricas (19009, 19090)
- **8888**: Traefik dashboard (único)

---

## Como acessar após deploy:

```bash
# Via IP direto (desenvolvimento/debug)
http://181.215.135.221:8888    # Traefik Dashboard
http://181.215.135.221:13000   # Grafana
http://181.215.135.221:19090   # Prometheus

# Via domínio (produção)
https://traefik.location404.com.br    # Traefik Dashboard
https://grafana.location404.com.br    # Grafana
https://prometheus.location404.com.br # Prometheus
```

## Firewall (se necessário):

Se estiver usando firewall, libere as portas:

```bash
# Essenciais
ufw allow 80/tcp
ufw allow 443/tcp

# Dashboards (opcional - pode deixar só via Traefik)
ufw allow 8888/tcp   # Traefik
ufw allow 13000/tcp  # Grafana
ufw allow 19090/tcp  # Prometheus
```
