# Projeto Location404 - Documentação Técnica Completa

**Última Atualização**: 2025-10-25
**Status**: Em desenvolvimento ativo (TCC)
**Versão**: 0.1.0-alpha

---

## 📋 Visão Geral

**Location404** é um jogo multiplayer competitivo estilo GeoGuessr onde dois jogadores competem para adivinhar localizações geográficas baseadas em imagens do Google Street View.

### Tipo de Projeto
- **TCC** (Trabalho de Conclusão de Curso)
- **Arquitetura de Microserviços**
- **Jogo multiplayer em tempo real**
- **Sistema de matchmaking, pontuação e ranking**

---

## 🎯 Objetivo Principal

Criar um jogo competitivo onde:
1. Dois jogadores entram em uma fila de matchmaking
2. Sistema encontra um oponente e cria uma partida
3. Partida consiste em **3 rodadas**
4. Cada rodada mostra uma localização aleatória via Google Street View
5. Jogadores fazem palpites clicando em um mapa interativo
6. Sistema calcula pontos baseado na **distância do palpite** (fórmula Haversine)
7. Ao final das 3 rodadas, determina vencedor
8. Pontos de ranking (ELO-style) são atualizados

---

## 🏗️ Arquitetura de Microserviços

### Diagrama de Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                      location404-web                             │
│                 (Vue 3 + TypeScript + Vite)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Components: PlayForm, StreetViewPanorama, GuessMap, etc.   │ │
│  │ Services: userIdentityService, gameEngineService,          │ │
│  │          geoDataService, googleMapsLoader                  │ │
│  │ State: Pinia (auth store)                                  │ │
│  │ Router: Vue Router (login, play, ranking, config, stats)  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────┬──────────────────────────┬────────────────────┬─────────┘
        │                          │                    │
        │ HTTP/REST                │ SignalR            │ HTTP/REST
        │ (Auth, Profile)          │ (Real-time Game)   │ (Locations, Stats)
        │                          │                    │
┌───────▼──────────┐      ┌────────▼───────────┐      ┌▼──────────────────┐
│ user-identity-   │      │  location404-game  │      │  location404-data │
│    service       │      │                    │      │                   │
│  (.NET 9 API)    │      │  (.NET 9 SignalR)  │      │   (.NET 9 API)    │
│                  │      │                    │      │                   │
│ • Autenticação   │      │ • Matchmaking      │      │ • 60 Localizações │
│ • Registro       │      │ • Game Hub         │      │ • Estatísticas    │
│ • Perfil         │      │ • Pontuação        │      │ • Rankings        │
│ • JWT Tokens     │      │ • Estado do Jogo   │      │ • Histórico       │
│                  │      │                    │      │                   │
│ PostgreSQL       │      │ Redis/Dragonfly    │      │ PostgreSQL        │
│ (Usuários)       │      │ (Cache & Queue)    │      │ (Matches, Stats)  │
└──────────────────┘      └────────┬───────────┘      └──────▲────────────┘
                                   │                         │
                                   │ RabbitMQ                │
                                   │ (Event Bus)             │
                                   └─────────────────────────┘

                          ┌────────────────────────┐
                          │  Supporting Services   │
                          ├────────────────────────┤
                          │ • RabbitMQ (AMQP 5672) │
                          │ • Dragonfly DB (Redis) │
                          │ • PostgreSQL (5432)    │
                          │ • OpenTelemetry        │
                          │ • Traefik (Proxy)      │
                          └────────────────────────┘
```

---

## 📦 Microserviços Detalhados

### 1. location404-web (Frontend)

**Tecnologias**:
- Vue 3.5.18 (Composition API)
- TypeScript 5.8
- Vite 7.0.6
- Pinia 3.0.3 (State Management)
- Axios 1.12.2 (HTTP)
- SignalR 9.0.6 (WebSocket)
- Google Maps API (Street View)
- Tailwind CSS 3.4.17
- Vue Router 4.5.1

**Portas**:
- Desenvolvimento: 5173
- Produção: 3400

**Estrutura**:
```
src/
├── components/          # Componentes Vue (PlayForm, StreetView, GuessMap, etc.)
├── composables/         # Lógica reutilizável (useGameEngine, useGeoData)
├── services/            # Clientes de API (SignalR, HTTP)
├── stores/              # Pinia stores (auth)
├── router/              # Rotas (login, play, ranking, config, stats)
├── types/               # TypeScript interfaces
├── config/              # Configuração (axios, constants)
├── core/                # DI Container
├── utils/               # Utilitários (error handling, images)
└── views/               # Páginas (LoginView, PlayView, RankingView, etc.)
```

**Variáveis de Ambiente**:
```env
VITE_USER_IDENTITY_API=http://localhost:5185
VITE_GAME_ENGINE_API=http://localhost:5170
VITE_GEO_DATA_API=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBQ5tXS7eMwUHvq88FD_HIWom-2vi7_R7E
```

---

### 2. location404-game (Motor do Jogo)

**Tecnologias**:
- .NET 9 (C# 12)
- ASP.NET Core (SignalR Hub)
- StackExchange.Redis 2.7.10
- RabbitMQ.Client 6.8.1
- OpenTelemetry

**Porta**: 5170

**Responsabilidades**:
- Matchmaking (fila FIFO com Redis)
- Gestão de partidas e rodadas (3 rounds)
- Cálculo de pontos (fórmula exponencial)
- Comunicação em tempo real via SignalR
- Publicação de eventos no RabbitMQ

**Estrutura (Clean Architecture)**:
```
Location404.Game.API/           # SignalR Hub + Endpoints
Location404.Game.Application/   # DTOs, Interfaces
Location404.Game.Domain/        # Entidades (GameMatch, GameRound, Coordinate)
Location404.Game.Infrastructure/# Redis, RabbitMQ, Cache, Matchmaking
```

**SignalR Hub**: `/gamehub`

**Métodos do Hub**:
| Método | Parâmetros | Descrição |
|--------|-----------|-----------|
| `JoinMatchmaking` | `JoinMatchmakingRequest` | Entrar na fila de matchmaking |
| `LeaveMatchmaking` | `Guid playerId` | Sair da fila |
| `StartRound` | `StartRoundRequest` | Iniciar nova rodada |
| `SubmitGuess` | `SubmitGuessRequest` | Submeter palpite (x, y) |
| `GetMatchStatus` | `Guid matchId` | Consultar estado da partida |

**Eventos do Hub** (Server → Client):
| Evento | Payload | Quando |
|--------|---------|--------|
| `MatchFound` | `MatchFoundResponse` | Match criado |
| `RoundStarted` | `RoundStartedResponse` | Rodada iniciada |
| `GuessSubmitted` | `string` | Palpite registrado |
| `RoundEnded` | `RoundEndedResponse` | Rodada finalizada |
| `MatchEnded` | `MatchEndedResponse` | Partida finalizada |
| `Error` | `string` | Erro ocorrido |

**Armazenamento Redis**:
```
match:{matchId}                → GameMatch JSON
player:match:{playerId}        → matchId
matches:active                 → Set de matchIds ativos
guess:{matchId}:{roundId}:{playerId} → "X,Y"
answer:{matchId}:{roundId}     → "X,Y" (resposta correta)
matchmaking:queue              → SortedSet (timestamp)
matchmaking:players            → Set (playerIds)
```

**RabbitMQ - Eventos Publicados**:
- `match.ended` → `GameMatchEndedEvent`
- `round.ended` → `GameRoundEndedEvent`

**Configuração**:
```json
{
  "Redis": {
    "Enabled": true,
    "ConnectionString": "location404-dragonflydb-...:6379,password=***,ssl=false"
  },
  "RabbitMQ": {
    "Enabled": true,
    "HostName": "location404-rabbitmq-...",
    "Port": 5672
  },
  "Location404.Data": {
    "BaseUrl": "http://localhost:5000"
  }
}
```

---

### 3. location404-auth (Autenticação)

**Tecnologias**:
- .NET 9 (C# 12)
- ASP.NET Core (Minimal APIs)
- Entity Framework Core 9.0.8
- Npgsql (PostgreSQL)
- BCrypt.Net-Next 4.0.3
- JWT Bearer Authentication
- Scalar.AspNetCore (API Docs)

**Porta**: 5185

**Responsabilidades**:
- Registro de usuários
- Autenticação (JWT + Refresh Token)
- Gestão de perfil (username, email, senha, imagem)
- Tokens em cookies HttpOnly
- Suporte a login externo (OAuth - não implementado)

**Estrutura (Clean Architecture)**:
```
Location404.Auth.API/           # Endpoints (Auth, Users)
Location404.Auth.Application/   # Commands, Queries (CQRS)
Location404.Auth.Domain/        # User, RefreshToken, EmailAddress
Location404.Auth.Infrastructure/# EF Core, PostgreSQL, BCrypt, JWT
```

**API REST Endpoints**:

**Authentication** (`/api/auth`):
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login com email/senha → cookies (access + refresh) |
| POST | `/api/auth/refresh` | Renovar tokens via refresh token cookie |

**User Management** (`/api/users`):
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/users` | Criar usuário com senha |
| GET | `/api/users/me` | Obter perfil do usuário atual (requer JWT) |
| PATCH | `/api/users/{id}` | Atualizar perfil (multipart/form-data) |

**Estrutura do Usuário**:
```csharp
User:
  - Id: Guid
  - Email: EmailAddress (Value Object, único)
  - Password: string (BCrypt hash, nullable)
  - Username: string (3-50 chars)
  - ProfileImage: byte[] (max 512KB)
  - EmailVerified: bool
  - IsActive: bool
  - PreferredLanguage: string (default "pt-BR")
  - CreatedAt, UpdatedAt, LastLoginAt
  - RefreshTokens: Collection
  - ExternalLogins: Collection
```

**Tokens**:
- **Access Token**: JWT (HS256), 15 minutos, HttpOnly cookie
- **Refresh Token**: Random 64 bytes, 7 dias, database-stored, HttpOnly cookie

**Database** (PostgreSQL):
- `users` (id, email, password, username, profile_image, etc.)
- `refresh_tokens` (id, user_id, token, expires_at_utc, revoked_at_utc)
- `external_logins` (user_id, login_provider, provider_key)

**Configuração**:
```json
{
  "ConnectionStrings": {
    "UserIdentityDatabaseDevelopment": "Host=181.215.135.221;Port=5432;Database=location404-useridentitydb-development;Username=location404;Password=***"
  },
  "JwtSettings": {
    "Issuer": "location404",
    "Audience": "location404",
    "SigningKey": "super_secret_key_for_development_purposes_only_change_me",
    "AccessTokenMinutes": 60,
    "RefreshTokenMinutes": 1440
  }
}
```

---

### 4. location404-data (Dados Geográficos)

**Tecnologias**:
- .NET 9 (C# 12)
- ASP.NET Core (REST API)
- Entity Framework Core 9.0.8
- Npgsql (PostgreSQL)
- RabbitMQ.Client 6.8.1
- OpenTelemetry

**Porta**: 5000

**Responsabilidades**:
- Armazenar **60 localizações** globais
- Consumir eventos de RabbitMQ (match.ended)
- Persistir histórico de partidas e rodadas
- Calcular estatísticas de jogadores
- Gerar rankings (ELO-style)

**Estrutura (Clean Architecture)**:
```
Location404.Data.API/           # Controllers (Locations, Matches, Players)
Location404.Data.Application/   # Services (LocationService, MatchService, PlayerStatsService)
Location404.Data.Domain/        # Location, GameMatch, GameRound, PlayerStats, Coordinate
Location404.Data.Infrastructure/# EF Core, PostgreSQL, RabbitMQ Consumer
```

**API REST Endpoints**:

**Locations** (`/api/locations`):
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/locations` | Listar todas localizações (activeOnly=true) |
| GET | `/api/locations/{id}` | Obter localização por ID |
| GET | `/api/locations/random` | Obter localização aleatória |
| POST | `/api/locations` | Criar nova localização |
| DELETE | `/api/locations/{id}` | Desativar localização (soft delete) |

**Matches** (`/api/matches`):
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/matches/ended` | Processar evento match.ended (HTTP fallback) |
| GET | `/api/matches/{id}` | Obter detalhes da partida com rodadas |
| GET | `/api/matches/player/{playerId}` | Histórico de partidas do jogador (skip/take) |

**Players** (`/api/players`):
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/players/{playerId}/stats` | Estatísticas do jogador |
| GET | `/api/players/ranking` | Ranking top (count=10, max 100) |

**Estrutura de Dados**:

**Location**:
```
- Id: Guid
- Coordinate: { X: Latitude, Y: Longitude }
- Name, Country, Region
- Heading (0-360°), Pitch (-90 a 90°)
- TimesUsed, AveragePoints, DifficultyRating (1-5)
- Tags: ["urban", "coastal", "mountain", etc.]
- IsActive: bool
```

**GameMatch**:
```
- Id, PlayerAId, PlayerBId
- PlayerATotalPoints, PlayerBTotalPoints
- WinnerId, LoserId (nullable)
- Rounds: List<GameRound> (max 3)
- StartedAt, EndedAt, IsCompleted
```

**GameRound**:
```
- Id, MatchId, RoundNumber (1-3)
- LocationId, CorrectAnswer: Coordinate
- PlayerAId, PlayerAGuess, PlayerADistance (km), PlayerAPoints
- PlayerBId, PlayerBGuess, PlayerBDistance, PlayerBPoints
- StartedAt, EndedAt, IsCompleted
```

**PlayerStats**:
```
- PlayerId (PK)
- TotalMatches, Wins, Losses, Draws
- TotalRoundsPlayed, TotalPoints, HighestScore
- AveragePointsPerRound, AverageDistanceErrorKm
- RankingPoints (ELO, inicial 1000)
- CreatedAt, LastMatchAt
```

**RabbitMQ - Evento Consumido**:
- Queue: `match-ended`
- Binding: `game-events/match.ended`
- Payload: `GameMatchEndedEvent` (matchId, players, rounds, scores)

**Database** (PostgreSQL):
```sql
Tables:
- Locations (60 seed locations)
- Matches (histórico de partidas)
- Rounds (histórico de rodadas)
- PlayerStats (estatísticas agregadas)
```

**Configuração**:
```json
{
  "ConnectionStrings": {
    "GeoDataDatabase": "Host=181.215.135.221;Port=5434;Database=geodataservice;Username=lcoation404;Password=***"
  },
  "RabbitMQ": {
    "Enabled": true,
    "HostName": "location404-rabbitmq-8b2418-181-215-135-221.traefik.me",
    "Port": 5672,
    "MatchEndedQueue": "match-ended"
  }
}
```

---

## 🔄 Fluxos de Comunicação

### 1. Fluxo de Autenticação

```
┌─────────────────┐     POST /users        ┌─────────────────────┐
│  location404-   │────────────────────────▶│  user-identity-     │
│     web         │                         │     service         │
│                 │◀────────────────────────│                     │
│ (RegisterForm)  │   RegisterResponse      │ • BCrypt password   │
└─────────────────┘                         │ • Save to DB        │
                                            │ • Return user ID    │
        │                                   └─────────────────────┘
        │
        │ Navigate to /login
        ▼
┌─────────────────┐     POST /auth/login   ┌─────────────────────┐
│  location404-   │────────────────────────▶│  user-identity-     │
│     web         │  { email, password }    │     service         │
│                 │                         │                     │
│  (LoginForm)    │◀────────────────────────│ • Verify BCrypt     │
│                 │  Set-Cookie: accessToken│ • Generate JWT      │
│                 │  Set-Cookie: refreshToken│ • Issue RefreshToken│
│                 │  { userId, username,    │ • Record LastLoginAt│
│                 │    email, profileImage }└─────────────────────┘
└─────────────────┘
        │
        │ Save to auth store (Pinia)
        │ Navigate to /play
        ▼
     ✓ Authenticated
```

### 2. Fluxo Completo do Jogo

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: MATCHMAKING                                                │
└─────────────────────────────────────────────────────────────────────┘

Frontend                    location404-game                Redis
   │                              │                            │
   │ SignalR Connect             │                            │
   ├────────────────────────────▶│                            │
   │                              │                            │
   │ JoinMatchmaking({playerId}) │                            │
   ├────────────────────────────▶│                            │
   │                              │ Add to queue               │
   │                              ├──────────────────────────▶│
   │                              │                            │
   │                              │ TryFindMatch()             │
   │                              │ (when 2+ players in queue) │
   │                              │◀──────────────────────────┤
   │                              │                            │
   │                              │ Create GameMatch           │
   │                              ├──────────────────────────▶│
   │                              │ Store match:{matchId}      │
   │                              │                            │
   │◀─────────MatchFound─────────┤                            │
   │ { matchId, playerAId,        │                            │
   │   playerBId, startTime }     │                            │
   │                              │                            │
   │ Show countdown (3 seconds)   │                            │
   │                              │                            │

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: ROUND GAMEPLAY (Repeats 3x)                               │
└─────────────────────────────────────────────────────────────────────┘

Frontend                    location404-game            location404-data
   │                              │                            │
   │ StartRound({matchId})        │                            │
   ├────────────────────────────▶│                            │
   │                              │ GET /api/locations/random  │
   │                              ├──────────────────────────▶│
   │                              │◀──────────────────────────┤
   │                              │ LocationDto                │
   │                              │ (x, y, heading, pitch)     │
   │                              │                            │
   │                              │ Store correct answer       │
   │                              │ (Redis)                    │
   │                              │                            │
   │◀────────RoundStarted─────────┤                            │
   │ { matchId, roundId,          │                            │
   │   roundNumber, location }    │                            │
   │                              │                            │
   │ Load Google Street View      │                            │
   │ (heading, pitch)             │                            │
   │ User explores & clicks map   │                            │
   │                              │                            │
   │ SubmitGuess({matchId,        │                            │
   │   playerId, x, y})           │                            │
   ├────────────────────────────▶│                            │
   │                              │ Store guess (Redis)        │
   │◀───────GuessSubmitted────────┤                            │
   │                              │                            │
   │ [Waiting for opponent...]    │                            │
   │                              │                            │
   │  (Opponent submits)          │                            │
   │                              │                            │
   │                              │ Both guesses received!     │
   │                              │ Calculate distances        │
   │                              │ (Haversine formula)        │
   │                              │ Calculate points           │
   │                              │ (exponential decay)        │
   │                              │                            │
   │◀──────────RoundEnded─────────┤                            │
   │ { roundId, correctAnswer,    │                            │
   │   playerAGuess, playerBGuess,│                            │
   │   playerAPoints, playerBPoints│                            │
   │   totalPoints, roundWinner } │                            │
   │                              │                            │
   │ Show RoundResult overlay     │                            │
   │ (map with 3 markers +        │                            │
   │  polylines + scores)         │                            │
   │                              │                            │
   │ [User clicks Continue]       │                            │
   │                              │                            │
   │ (Loop back for rounds 2, 3)  │                            │

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: MATCH END (After 3 rounds)                                │
└─────────────────────────────────────────────────────────────────────┘

Frontend            location404-game        RabbitMQ        location404-data
   │                        │                    │                  │
   │                        │ EndGameMatch()     │                  │
   │                        │ Determine winner   │                  │
   │                        │                    │                  │
   │◀────MatchEnded─────────┤                    │                  │
   │ { matchId, winnerId,   │                    │                  │
   │   loserId, points,     │                    │                  │
   │   rounds[] }           │                    │                  │
   │                        │                    │                  │
   │ Show MatchResult       │                    │                  │
   │ (winner animation,     │                    │                  │
   │  points +/-, rounds    │                    │                  │
   │  breakdown)            │                    │                  │
   │                        │                    │                  │
   │                        │ Publish: match.ended                  │
   │                        ├──────────────────▶│                  │
   │                        │ GameMatchEndedEvent│                  │
   │                        │                    │─────────────────▶│
   │                        │                    │ Consume event    │
   │                        │                    │                  │
   │                        │                    │ ┌────────────────┤
   │                        │                    │ │ Transaction:   │
   │                        │                    │ │ • Create Match │
   │                        │                    │ │ • Create Rounds│
   │                        │                    │ │ • Update       │
   │                        │                    │ │   PlayerStats  │
   │                        │                    │ └────────────────┤
   │                        │                    │                  │
   │ [User clicks Play      │                    │                  │
   │  Again]                │                    │                  │
   │                        │                    │                  │
   │ JoinMatchmaking()      │                    │                  │
   │ (restart cycle)        │                    │                  │
```

### 3. Fluxo de Estatísticas e Ranking

```
Frontend                          location404-data
   │                                     │
   │ Navigate to /ranking                │
   │ GET /api/players/ranking?count=100  │
   ├───────────────────────────────────▶│
   │                                     │
   │                                     │ Query: SELECT TOP 100
   │                                     │ FROM PlayerStats
   │                                     │ ORDER BY RankingPoints DESC
   │                                     │
   │◀────────────────────────────────────┤
   │ PlayerStats[] (top 100 players)     │
   │ { playerId, totalMatches, wins,     │
   │   rankingPoints, winRate, etc. }    │
   │                                     │
   │ Render ranking table with medals    │
   │                                     │
   │                                     │
   │ Navigate to /config                 │
   │ GET /api/players/{playerId}/stats   │
   ├───────────────────────────────────▶│
   │                                     │
   │◀────────────────────────────────────┤
   │ PlayerStats (current user)          │
   │                                     │
   │ GET /api/matches/player/{playerId}  │
   ├───────────────────────────────────▶│
   │                                     │
   │◀────────────────────────────────────┤
   │ GameMatch[] (match history)         │
   │                                     │
   │ Render stats dashboard & history    │
```

---

## 📊 Sistema de Pontuação

### Fórmula de Cálculo

**Decaimento Exponencial (GeoGuessr-style)**:
```
pontos = 5000 × e^(-distância_km / 2000)

Onde:
- distância_km: Calculada via fórmula de Haversine
- Máximo: 5000 pontos (palpite perfeito)
- Fator de escala: 2000 km (controla velocidade de decaimento)
```

**Fórmula de Haversine** (distância geodésica):
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × arctan2(√a, √(1-a))
distância = R × c

Onde:
- R = 6371 km (raio da Terra)
- Δlat, Δlon = diferenças de latitude/longitude em radianos
```

### Tabela de Pontos

| Distância | Pontos | Avaliação |
|-----------|--------|-----------|
| 0 km | 5000 | Perfeito! |
| 100 km | 4756 | Excelente |
| 500 km | 3894 | Muito bom |
| 1000 km | 3033 | Bom |
| 2000 km | 1839 | Razoável |
| 5000 km | 410 | Longe |
| 10000 km | 34 | Muito longe |
| 20000 km | 0 | Oposto do mundo |

**Pontuação Máxima por Partida**: 15.000 pontos (3 rodadas × 5000)

---

## 🏆 Sistema de Ranking (ELO-Style)

### Pontos de Ranking

**Inicial**: 1000 pontos

**Ajustes por Partida**:
| Resultado | Ajuste |
|-----------|--------|
| Vitória | +25 pontos |
| Derrota | -10 pontos (mínimo 0) |
| Empate | +5 pontos |

**Características**:
- Sistema simples de pontos fixos
- Não considera diferença de habilidade entre oponentes
- Monotonicamente crescente (vitórias) ou decrescente (derrotas)
- Floor de 0 pontos (não pode ficar negativo)

### Leaderboard

**Endpoint**: `GET /api/players/ranking?count=100`

**Ordenação**: `RankingPoints DESC`

**Response**:
```json
[
  {
    "playerId": "guid",
    "totalMatches": 50,
    "wins": 35,
    "losses": 12,
    "draws": 3,
    "winRate": 70.0,
    "totalRoundsPlayed": 150,
    "totalPoints": 562500,
    "highestScore": 5000,
    "averagePointsPerRound": 3750.0,
    "averageDistanceErrorKm": 850.5,
    "rankingPoints": 1300,
    "lastMatchAt": "2024-10-25T15:30:00Z"
  }
]
```

---

## 🗺️ Pool de Localizações (60 Globais)

### Distribuição Geográfica

| Região | Quantidade | Exemplos |
|--------|-----------|----------|
| **América do Sul** | 10 | São Paulo, Rio de Janeiro, Buenos Aires, Santiago, Lima, Bogotá, Manaus, Curitiba, Salvador, Brasília |
| **América do Norte** | 9 | Nova York, São Francisco, Los Angeles, Chicago, Miami, Seattle, Cidade do México, Toronto, Vancouver |
| **Europa Ocidental** | 7 | Paris, Londres, Amsterdam, Bruxelas, Barcelona, Madrid, Lisboa |
| **Europa Central/Oriental** | 7 | Roma, Berlim, Viena, Praga, Estocolmo, Copenhague, Varsóvia |
| **Europa Sul/Oriental** | 3 | Atenas, Istambul, Moscou |
| **Ásia Oriental** | 6 | Tóquio, Seul, Pequim, Shanghai, Hong Kong, Taipei |
| **Sudeste Asiático** | 5 | Singapura, Bangkok, Jacarta, Manila, Hanói |
| **Sul da Ásia/Oriente Médio** | 4 | Nova Délhi, Mumbai, Dubai, Beirute |
| **África** | 4 | Cairo, Joanesburgo, Cidade do Cabo, Nairóbi |
| **Oceania** | 3 | Sydney, Melbourne, Wellington |

### Estrutura de Cada Localização

```typescript
{
  id: Guid
  coordinate: {
    x: Latitude  (-90 a +90)
    y: Longitude (-180 a +180)
  }
  name: string          // "São Paulo, Brazil"
  country: string       // "Brazil"
  region: string        // "South America"

  // Configuração do Street View
  heading: int?         // Direção da câmera (0-360°)
  pitch: int?           // Inclinação (-90 a +90°)

  // Estatísticas
  timesUsed: int        // Vezes usada em partidas
  averagePoints: double?// Pontuação média nesta localização
  difficultyRating: int?// Dificuldade (1-5)

  // Metadados
  tags: string[]        // ["urban", "coastal", "mountain", etc.]
  isActive: boolean     // Ativa para seleção aleatória
  createdAt: DateTime
}
```

### Tags Disponíveis

- `urban`, `rural`, `metropolitan`
- `coastal`, `beach`, `mountain`, `jungle`
- `historic`, `landmark`, `scenic`
- `capital`, `nature`

---

## 🔐 Autenticação e Segurança

### JWT Tokens

**Access Token**:
- Algoritmo: HS256 (HMAC SHA256)
- Expiração: 15 minutos (configurável)
- Claims:
  - `sub`: User ID (GUID)
  - `unique_name`: Username
  - `jti`: Token ID (GUID)
  - `role`: Roles array (["User"])
- Armazenamento: Cookie HttpOnly (`accessToken`)
- SameSite: Lax
- Secure: false (dev), true (prod)

**Refresh Token**:
- Tipo: Random 64 bytes (Base64 encoded)
- Expiração: 7 dias
- Armazenamento: Database + Cookie HttpOnly (`refreshToken`)
- Path: `/api/auth/refresh`
- Pode ser revogado (campo `RevokedAtUtc`)

### Ciclo de Autenticação

```
1. POST /auth/login
   Input: { email, password }
   → Verify BCrypt hash
   → Generate JWT (15 min)
   → Issue RefreshToken (7 days, store in DB)
   → Set cookies: accessToken, refreshToken
   Output: { userId, username, email, profileImage }

2. Authenticated requests
   → Frontend sends cookies automatically
   → Backend validates JWT signature & expiration
   → Extracts userId from 'sub' claim

3. Token expiration (after 15 min)
   → Frontend detects 401 Unauthorized
   → POST /auth/refresh (with refreshToken cookie)
   → Backend validates refresh token in DB
   → Issue new pair (revoke old token)
   → Set new cookies

4. Logout
   → Frontend deletes cookies
   → Backend revokes refresh token (optional)
```

### Hash de Senha

- Algoritmo: **BCrypt**
- Work factor: 10 (default)
- Geração automática de salt
- Tempo por hash: ~100ms
- Resistente a rainbow tables e força bruta

---

## 🔄 Mensageria (RabbitMQ)

### Configuração

**Exchange**: `game-events`
**Tipo**: Topic
**Durable**: true

### Eventos Publicados

#### 1. `match.ended` (por location404-game)

**Routing Key**: `match.ended`
**Queue**: `match-ended`
**Consumer**: location404-data (MatchConsumerService)

**Payload** (`GameMatchEndedEvent`):
```json
{
  "matchId": "guid",
  "playerAId": "guid",
  "playerBId": "guid",
  "winnerId": "guid?",
  "loserId": "guid?",
  "playerATotalPoints": 15000,
  "playerBTotalPoints": 12000,
  "pointsEarned": 25,
  "pointsLost": 10,
  "startTime": "2024-10-25T10:00:00Z",
  "endTime": "2024-10-25T10:05:00Z",
  "rounds": [
    {
      "id": "guid",
      "gameMatchId": "guid",
      "roundNumber": 1,
      "playerAId": "guid",
      "playerBId": "guid",
      "playerAPoints": 5000,
      "playerBPoints": 4500,
      "gameResponse": { "x": -23.5505, "y": -46.6333 },
      "playerAGuess": { "x": -23.5500, "y": -46.6330 },
      "playerBGuess": { "x": -23.5510, "y": -46.6340 },
      "gameRoundEnded": true
    },
    // rounds 2 & 3
  ]
}
```

**Processamento (location404-data)**:
1. Receber evento da fila
2. Verificar idempotência (match já existe?)
3. Iniciar transação
4. Criar `GameMatch` entity
5. Criar 3 `GameRound` entities
6. Atualizar `PlayerStats` para ambos jogadores:
   - Incrementar `TotalMatches`
   - Incrementar `Wins` / `Losses` / `Draws`
   - Ajustar `RankingPoints` (+25 win, -10 loss, +5 draw)
   - Acumular `TotalRoundsPlayed`, `TotalPoints`
   - Recalcular médias (`AveragePointsPerRound`, `AverageDistanceErrorKm`)
   - Atualizar `HighestScore`
   - Definir `LastMatchAt`
7. Commit transação
8. ACK mensagem (remove da fila)

#### 2. `round.ended` (por location404-game)

**Routing Key**: `round.ended`
**Queue**: `round-ended` (não consumido atualmente)

**Payload** (`GameRoundEndedEvent`):
```json
{
  "matchId": "guid",
  "roundId": "guid",
  "roundNumber": 1,
  "playerAId": "guid",
  "playerBId": "guid",
  "gameResponse": { "x": 0.0, "y": 0.0 },
  "playerAGuess": { "x": 0.0, "y": 0.0 },
  "playerBGuess": { "x": 0.0, "y": 0.0 },
  "playerAPoints": 4500,
  "playerBPoints": 3200,
  "winnerId": "guid?",
  "endTime": "2024-01-01T12:00:00Z"
}
```

### Configuração de Conexão

**Properties**:
- `AutomaticRecoveryEnabled`: true
- `NetworkRecoveryInterval`: 10 segundos
- `RequestedHeartbeat`: 60 segundos
- `RequestedConnectionTimeout`: 30 segundos

**Retry Logic**:
- Max retries: 3
- Backoff: 2 segundos × retryCount
- Fallback: HTTP POST para location404-data (fire-and-forget)

---

## 💾 Bancos de Dados

### 1. PostgreSQL (location404-auth)

**Host**: 181.215.135.221
**Port**: 5432
**Database**: location404-useridentitydb-development

**Tabelas**:
```sql
users:
  - id (uuid, PK)
  - email (varchar, UNIQUE)
  - password (varchar, nullable)
  - username (varchar)
  - profile_image (bytea, max 512KB)
  - email_verified (boolean)
  - is_active (boolean)
  - preferred_language (varchar)
  - created_at, updated_at, last_login_at (timestamp)

refresh_tokens:
  - id (uuid, PK)
  - user_id (uuid, FK → users.id)
  - token (varchar, UNIQUE)
  - expires_at_utc (timestamp)
  - revoked_at_utc (timestamp, nullable)

external_logins:
  - user_id (uuid, FK → users.id)
  - login_provider (varchar)
  - provider_key (varchar)
  - PK: (login_provider, provider_key)
```

### 2. PostgreSQL (location404-data)

**Host**: 181.215.135.221
**Port**: 5434
**Database**: geodataservice

**Tabelas**:
```sql
Locations:
  - Id (uuid, PK)
  - Latitude, Longitude (double precision)
  - Name, Country, Region (varchar)
  - Heading, Pitch (integer, nullable)
  - TimesUsed (integer, default 0)
  - AveragePoints (double precision, nullable)
  - DifficultyRating (integer, nullable)
  - Tags (jsonb, default [])
  - IsActive (boolean, default true)
  - CreatedAt, UpdatedAt (timestamp)

Matches:
  - Id (uuid, PK)
  - PlayerAId, PlayerBId (uuid)
  - PlayerATotalPoints, PlayerBTotalPoints (integer)
  - WinnerId, LoserId (uuid, nullable)
  - StartedAt, EndedAt (timestamp)
  - IsCompleted (boolean)

Rounds:
  - Id (uuid, PK)
  - MatchId (uuid, FK → Matches.Id)
  - RoundNumber (integer, 1-3)
  - LocationId (uuid)
  - CorrectAnswerLatitude, CorrectAnswerLongitude (double)
  - PlayerAId, PlayerAGuessLat, PlayerAGuessLng, PlayerADistance, PlayerAPoints
  - PlayerBId, PlayerBGuessLat, PlayerBGuessLng, PlayerBDistance, PlayerBPoints
  - StartedAt, EndedAt (timestamp)
  - IsCompleted (boolean)

PlayerStats:
  - PlayerId (uuid, PK)
  - TotalMatches, Wins, Losses, Draws (integer)
  - TotalRoundsPlayed, TotalPoints, HighestScore (integer)
  - AveragePointsPerRound (double)
  - TotalDistanceErrorKm, AverageDistanceErrorKm (double)
  - RankingPoints (integer, default 1000)
  - CreatedAt, LastMatchAt (timestamp)
```

**Seed Data**: 60 localizações globais (DataSeeder.cs)

### 3. Redis/Dragonfly (location404-game)

**Host**: location404-dragonflydb-...
**Port**: 6379
**Type**: Dragonfly (Redis-compatible)

**Estrutura de Chaves**:
```
# Matchmaking
matchmaking:queue                    → SortedSet (timestamp)
matchmaking:players                  → Set (playerIds)

# Partidas
match:{matchId}                      → String (GameMatch JSON)
player:match:{playerId}              → String (matchId)
matches:active                       → Set (matchIds)

# Palpites temporários
guess:{matchId}:{roundId}:{playerId} → String ("X,Y")
answer:{matchId}:{roundId}           → String ("X,Y")

# Conexões SignalR
player:connection:{playerId}         → String (connectionId)

# Locks (operações atômicas)
lock:match:{matchId}                 → String (lockValue)
```

**Expirações**:
- Partidas: 2 horas
- Palpites: Removidos após rodada terminar (5 minutos)
- Conexões: 24 horas

---

## 🛠️ Tecnologias e Dependências

### Frontend (location404-web)

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `vue` | 3.5.18 | Framework UI |
| `@microsoft/signalr` | 9.0.6 | WebSocket real-time |
| `axios` | 1.12.2 | HTTP client |
| `pinia` | 3.0.3 | State management |
| `vue-router` | 4.5.1 | Client-side routing |
| `vue-sonner` | 2.0.8 | Toast notifications |
| `@types/google.maps` | 3.58.1 | Google Maps types |
| `tailwindcss` | 3.4.17 | CSS framework |
| `typescript` | 5.8 | Type safety |
| `vite` | 7.0.6 | Build tool |

### Backend (.NET 9)

**Pacotes Comuns**:
- `Microsoft.AspNetCore.OpenApi` (9.0.9)
- `Location404.Shared.Observability` (0.0.4) - OpenTelemetry

**location404-game**:
- `StackExchange.Redis` (2.7.10)
- `RabbitMQ.Client` (6.8.1)
- `Microsoft.AspNetCore.SignalR`

**location404-auth**:
- `Npgsql.EntityFrameworkCore.PostgreSQL` (9.0.4)
- `Microsoft.EntityFrameworkCore` (9.0.8)
- `BCrypt.Net-Next` (4.0.3)
- `System.IdentityModel.Tokens.Jwt` (8.14.0)
- `Microsoft.AspNetCore.Authentication.JwtBearer` (9.0.8)
- `Scalar.AspNetCore` (2.6.9)

**location404-data**:
- `Npgsql.EntityFrameworkCore.PostgreSQL` (9.0.4)
- `Microsoft.EntityFrameworkCore` (9.0.8)
- `RabbitMQ.Client` (6.8.1)

---

## 🐛 Bugs Resolvidos

### 1. Race Condition em SubmitGuess
**Problema**: "No active round" quando ambos jogadores submetem palpites simultaneamente

**Causa**:
```
PlayerA submete → armazena palpite
PlayerB submete → armazena palpite → detecta 2 palpites → EndCurrentGameRound()
                → CurrentGameRound = null
PlayerA continua → tenta acessar CurrentGameRound.Id → ERRO
```

**Solução**:
```csharp
// Salvar roundId ANTES de qualquer operação
var currentRoundId = match.CurrentGameRound.Id;

// Depois de detectar 2 palpites, re-fetch da partida
match = await _matchManager.GetMatchAsync(request.MatchId);

// Verificar idempotência
if (match.CurrentGameRound == null || match.CurrentGameRound.Id != currentRoundId)
{
    return; // Round já foi finalizado, skip
}

// Usar roundId salvo em vez de CurrentGameRound.Id
```

### 2. Pontuação Sempre Zero
**Problema**: Todos palpites retornavam 0 pontos

**Causa**: Thresholds em km muito pequenos (0, 1, 2 km) para distâncias reais (milhares de km)

**Solução**: Fórmula de decaimento exponencial (detalhada acima)

### 3. Localizações Repetidas
**Problema**: Mesma região (ex: 3x USA) em rodadas consecutivas

**Causas**:
- `new Random()` criado por chamada → seed collision
- Pool pequeno (14 locais)

**Solução**:
- `private static readonly Random _random` (singleton)
- Expandido para 60 localizações globais

### 4. Jogadores Presos em Partidas
**Problema**: Após terminar jogo, não consegue entrar em novo matchmaking

**Causa**: Partida não removida do Redis quando termina

**Solução**: Auto-cleanup em JoinMatchmaking
```csharp
if (await _matchManager.IsPlayerInMatchAsync(playerId))
{
    var match = await _matchManager.GetPlayerCurrentMatchAsync(playerId);

    if (match.EndTime == default(DateTime))
        match.EndGameMatch();

    await _matchManager.UpdateMatchAsync(match);
    await _matchManager.RemoveMatchAsync(match.Id);
}
```

---

## 📁 Estrutura de Diretórios

```
tcc/
├── location404-web/              # Frontend (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── components/           # Componentes Vue
│   │   ├── composables/          # Lógica reutilizável
│   │   ├── services/             # Clientes de API
│   │   ├── stores/               # Pinia stores
│   │   ├── router/               # Rotas
│   │   ├── types/                # TypeScript interfaces
│   │   ├── config/               # Configurações
│   │   ├── core/                 # DI Container
│   │   ├── utils/                # Utilitários
│   │   └── views/                # Páginas
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env
│
├── location404-game/             # Motor do jogo (.NET 9)
│   ├── src/
│   │   ├── Location404.Game.API/           # SignalR Hub
│   │   │   ├── Hubs/GameHub.cs
│   │   │   ├── Program.cs
│   │   │   └── appsettings.json
│   │   ├── Location404.Game.Application/   # DTOs, Interfaces
│   │   ├── Location404.Game.Domain/        # Entities
│   │   └── Location404.Game.Infrastructure/# Redis, RabbitMQ
│   └── Dockerfile
│
├── location404-auth/        # Autenticação (.NET 9)
│   ├── src/
│   │   ├── Location404.Auth.API/           # Endpoints
│   │   │   ├── Endpoints/
│   │   │   ├── Program.cs
│   │   │   └── appsettings.json
│   │   ├── Location404.Auth.Application/   # CQRS Commands/Queries
│   │   ├── Location404.Auth.Domain/        # User Entity
│   │   └── Location404.Auth.Infrastructure/# EF Core, BCrypt, JWT
│   ├── tests/
│   └── Dockerfile
│
├── location404-data/             # Dados geográficos (.NET 9)
│   ├── src/
│   │   ├── Location404.Data.API/           # Controllers
│   │   │   ├── Controllers/
│   │   │   ├── Program.cs
│   │   │   └── appsettings.json
│   │   ├── Location404.Data.Application/   # Services
│   │   ├── Location404.Data.Domain/        # Entities
│   │   └── Location404.Data.Infrastructure/# EF Core, RabbitMQ Consumer
│   └── Dockerfile
│
└── PROJETO_LOCATION404_CONTEXTO.md  # Este documento
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- .NET 9 SDK
- Docker (opcional para infraestrutura)
- PostgreSQL 12+
- Redis/Dragonfly
- RabbitMQ
- Google Maps API Key

### Frontend
```bash
cd location404-web
npm install
cp .env.example .env  # Configure API URLs
npm run dev           # http://localhost:5173
```

### Backend - location404-game
```bash
cd location404-game
dotnet restore
dotnet build
cd src/Location404.Game.API
dotnet run           # http://localhost:5170
```

### Backend - location404-auth
```bash
cd location404-auth
dotnet restore
dotnet build
cd src/Location404.Auth.API
dotnet run           # http://localhost:5185
```

### Backend - location404-data
```bash
cd location404-data
dotnet restore
dotnet build
cd src/Location404.Data.API
dotnet run           # http://localhost:5000
```

### Infraestrutura (Docker Compose)
```bash
# PostgreSQL, Redis, RabbitMQ, OpenTelemetry
docker-compose up -d
```

---

## 🧪 Testes

### Frontend
```bash
cd location404-web
npm run test          # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Cypress/Playwright)
```

### Backend
```bash
cd location404-auth
dotnet test           # Run all unit tests
```

---

## 📊 Observabilidade

### OpenTelemetry

**Collector Endpoint**: `http://optel-collector:4317` (OTLP gRPC)

**Serviços Instrumentados**:
- `location404-game` (traces, metrics, logs)
- `location404-auth` (traces, metrics, logs)
- `location404-data` (traces, metrics, logs)

**Configuração**:
```json
{
  "OpenTelemetry": {
    "ServiceName": "service-name",
    "ServiceVersion": "0.0.1",
    "ServiceNamespace": "location404",
    "CollectorEndpoint": "http://optel-collector:4317",
    "Tracing": {
      "Enabled": true,
      "SamplingRatio": 0.1,  // 10% sampling
      "RecordExceptions": true
    },
    "Metrics": { "Enabled": true },
    "Logging": { "Enabled": true }
  }
}
```

**Traces Capturados**:
- HTTP requests (ASP.NET Core)
- SignalR connections & invocations
- Redis operations
- Database queries (EF Core)
- RabbitMQ publishing/consuming
- Custom spans

---

## 🔒 Segurança

### Considerações Implementadas
✅ BCrypt password hashing (work factor 10)
✅ JWT tokens com expirações curtas (15 min)
✅ Refresh tokens com revogação
✅ HttpOnly cookies (previne XSS)
✅ SameSite=Lax (previne CSRF)
✅ Validação de entrada (backend + frontend)
✅ CORS configurado por origem
✅ SQL injection prevention (EF Core parameterized queries)

### Melhorias Futuras
⚠️ HTTPS enforcement (produção)
⚠️ Cookie Secure flag (produção)
⚠️ JWT signing key forte (produção)
⚠️ Rate limiting (login, token refresh)
⚠️ Two-factor authentication
⚠️ Email verification
⚠️ Password reset flow
⚠️ Validação de MIME type para upload de imagens

---

## 🗂️ Convenção de Coordenadas (Universal)

**Padrão do Projeto**:
```
X = Latitude  (Norte/Sul, -90 a +90)
Y = Longitude (Leste/Oeste, -180 a +180)
```

**Backend (C#)**:
```csharp
public record Coordinate(double X, double Y)
{
    public double Latitude => X;
    public double Longitude => Y;
}

// Exemplo: São Paulo
new Coordinate(-23.5505, -46.6333)
//          Lat (X)   Lng (Y)
```

**Frontend (TypeScript)**:
```typescript
interface Coordinate {
  x: number  // Latitude
  y: number  // Longitude
}

// Google Maps
map.setCenter({
  lat: coordinate.x,  // Latitude
  lng: coordinate.y   // Longitude
})
```

---

## 📝 Regras de Desenvolvimento

### Commits
- **NÃO commitar sem permissão explícita do usuário**
- Formato: `feat: adicionar X` ou `fix: corrigir Y`
- Mensagens em português

### Código
- **Backend**: Primary constructors, async/await, logging extensivo
- **Frontend**: Composition API, TypeScript strict, composables reutilizáveis
- **Convenção de coordenadas**: SEMPRE X=Lat, Y=Lng
- **Clean Architecture**: Separação clara de responsabilidades

---

## 🎮 Regras do Jogo

1. **Matchmaking**: Dois jogadores entram na fila; sistema pareia automaticamente
2. **Countdown**: 3 segundos antes de cada rodada
3. **Rodadas**: 3 rodadas por partida
4. **Exploração**: Jogadores podem navegar no Street View (pan, zoom, move)
5. **Palpite**: Click no mapa mundial para marcar localização
6. **Confirmação**: Ambos devem submeter antes de ver resultado
7. **Resultado**: Mapa mostra 3 marcadores (correto, jogador A, jogador B) + polylines + distâncias + pontos
8. **Vitória**: Jogador com maior pontuação total após 3 rodadas
9. **Empate**: Possível se pontuações idênticas
10. **Ranking**: Pontos ELO atualizados após cada partida

---

## 📈 Roadmap Futuro

### Funcionalidades Planejadas
- [ ] Modo solo (vs. tempo)
- [ ] Salas privadas (convite de amigos)
- [ ] Torneios
- [ ] Temas personalizados (ex: apenas Europa, apenas cidades)
- [ ] Dificuldade dinâmica (localizações mais difíceis para jogadores avançados)
- [ ] Achievements/badges
- [ ] Chat em tempo real
- [ ] Replay de partidas
- [ ] Mobile app (React Native ou Flutter)

### Melhorias Técnicas
- [ ] Horizontal scaling (SignalR backplane com Redis)
- [ ] GraphQL para queries complexas
- [ ] CQRS completo (event sourcing)
- [ ] Testes E2E automatizados
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment
- [ ] Monitoring dashboard (Grafana + Prometheus)
- [ ] Load testing (JMeter/k6)

---

## 📞 Contato e Suporte

**Equipe**: Location404
**Projeto**: TCC (Trabalho de Conclusão de Curso)
**Status**: Em desenvolvimento ativo
**Versão**: 0.1.0-alpha

---

**Este documento foi gerado automaticamente em 2025-10-25 com análise completa dos 4 microserviços.**
