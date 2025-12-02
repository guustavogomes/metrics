# Deploy no Render - Guia de Referência

## Estrutura do Projeto

```
mcp/
├── server.ts                 # Bot Slack principal
├── package.json              # Dependências e scripts
├── tsconfig.json             # Configuração TypeScript
├── render.yaml               # Configuração do Render (Blueprint)
├── lib/
│   └── update-pixel-caches.ts   # Lógica de atualização de caches
├── scripts/
│   ├── update-all-stats.ts      # Script de atualização de estatísticas
│   └── sync-pixel-posts.ts      # Script de sincronização de posts
├── services/
│   └── pixel-analytics-service.ts
└── utils/
    └── slack-formatter.ts
```

## Serviços no Render

### 1. Bot Slack (Worker)
- **Tipo**: Background Worker
- **Nome**: `pixel-slack-bot`
- **Execução**: 24/7 (sempre rodando)
- **Start Command**: `npm start`

### 2. Sync Posts (Cron Job)
- **Tipo**: Cron Job
- **Nome**: `sync-posts-daily`
- **Schedule**: `0 5 * * *` (05:00 UTC / 02:00 Brasília)
- **Start Command**: `npm run sync-posts`
- **Função**: Sincroniza posts do Beehiiv com o banco

### 3. Update Stats (Cron Job)
- **Tipo**: Cron Job
- **Nome**: `update-stats-daily`
- **Schedule**: `0 6 * * *` (06:00 UTC / 03:00 Brasília)
- **Start Command**: `npm run update-stats`
- **Função**: Atualiza pixel_daily_stats, pixel_stats_cache, pixel_overlap_cache

## Variáveis de Ambiente

### Bot Slack
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
PIXEL_DB_HOST=24.144.88.69
PIXEL_DB_PORT=5432
PIXEL_DB_NAME=waffle_metrics
PIXEL_DB_USER=waffle
PIXEL_DB_PASSWORD=...
```

### Cron Jobs
```
PIXEL_DB_HOST=24.144.88.69
PIXEL_DB_PORT=5432
PIXEL_DB_NAME=waffle_metrics
PIXEL_DB_USER=waffle
PIXEL_DB_PASSWORD=...
BEEHIIV_API_KEY=... (apenas para sync-posts)
```

## Comandos Úteis

### Deploy via Git
```bash
cd mcp
git add .
git commit -m "feat: descrição da mudança"
git push
# Deploy automático no Render
```

### API do Render

```bash
# Listar serviços
curl -s "https://api.render.com/v1/services?ownerId=tea-d4mpes6uk2gs7396qkjg" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Disparar deploy manual
curl -s -X POST "https://api.render.com/v1/services/{SERVICE_ID}/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Executar cron job manualmente
curl -s -X POST "https://api.render.com/v1/services/{CRON_ID}/jobs" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Atualizar variáveis de ambiente
curl -s -X PUT "https://api.render.com/v1/services/{SERVICE_ID}/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"key": "VAR_NAME", "value": "valor"}]'
```

### IDs dos Serviços
- **pixel-slack-bot**: `srv-d4mqdoeuk2gs7397nsmg`
- **sync-posts-daily**: `crn-d4mqlv6uk2gs7397v5p0`
- **update-stats-daily**: `crn-d4mqlv6uk2gs7397v5og`
- **Owner ID**: `tea-d4mpes6uk2gs7396qkjg`

## Links Úteis

- **Dashboard**: https://dashboard.render.com
- **Bot Slack**: https://dashboard.render.com/worker/srv-d4mqdoeuk2gs7397nsmg
- **Sync Posts**: https://dashboard.render.com/cron/crn-d4mqlv6uk2gs7397v5p0
- **Update Stats**: https://dashboard.render.com/cron/crn-d4mqlv6uk2gs7397v5og
- **Repositório**: https://github.com/guustavogomes/pixel_bot

## Troubleshooting

### Build falhou com erro de TypeScript
- Verificar `tsconfig.json` com `strict: false` e `noImplicitAny: false`
- Usar `any` para tipos problemáticos do Slack

### Bot desconectando (pong timeout)
- Normal em conexões instáveis
- Render reconecta automaticamente

### Cron job não executou
- Verificar logs no dashboard
- Verificar variáveis de ambiente
- Executar manualmente via API para testar

## Criando Novo Cron Job via API

```bash
curl -s -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cron_job",
    "name": "nome-do-job",
    "ownerId": "tea-d4mpes6uk2gs7396qkjg",
    "repo": "https://github.com/guustavogomes/pixel_bot",
    "branch": "main",
    "autoDeploy": "yes",
    "serviceDetails": {
      "runtime": "node",
      "region": "oregon",
      "plan": "starter",
      "buildCommand": "npm install && npm run build",
      "startCommand": "npm run nome-script",
      "schedule": "0 6 * * *"
    }
  }'
```

---

**Última atualização**: 1 de dezembro de 2025
