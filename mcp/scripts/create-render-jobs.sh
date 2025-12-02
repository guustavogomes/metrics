#!/bin/bash

# Script para criar cron jobs no Render via API
#
# Uso:
#   export RENDER_API_KEY="rnd_xxxxxxxx"
#   export RENDER_OWNER_ID="seu_owner_id"  # Pegar do dashboard
#   bash scripts/create-render-jobs.sh

API_KEY="${RENDER_API_KEY}"
OWNER_ID="${RENDER_OWNER_ID}"
REPO_URL="https://github.com/guustavogomes/pixel_bot"
BRANCH="main"

if [ -z "$API_KEY" ]; then
  echo "Erro: RENDER_API_KEY não definida"
  echo "Acesse: https://dashboard.render.com/u/settings -> API Keys"
  exit 1
fi

if [ -z "$OWNER_ID" ]; then
  echo "Erro: RENDER_OWNER_ID não definida"
  echo "Acesse: https://dashboard.render.com e pegue o ID do owner"
  exit 1
fi

echo "=== Criando Cron Job: sync-posts-daily ==="

curl -s -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cron_job",
    "name": "sync-posts-daily",
    "ownerId": "'"$OWNER_ID"'",
    "repo": "'"$REPO_URL"'",
    "branch": "'"$BRANCH"'",
    "autoDeploy": "yes",
    "serviceDetails": {
      "env": "node",
      "plan": "starter",
      "region": "oregon",
      "buildCommand": "npm install && npm run build",
      "startCommand": "npm run sync-posts",
      "schedule": "0 5 * * *"
    }
  }' | jq .

echo ""
echo "=== Criando Cron Job: update-stats-daily ==="

curl -s -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cron_job",
    "name": "update-stats-daily",
    "ownerId": "'"$OWNER_ID"'",
    "repo": "'"$REPO_URL"'",
    "branch": "'"$BRANCH"'",
    "autoDeploy": "yes",
    "serviceDetails": {
      "env": "node",
      "plan": "starter",
      "region": "oregon",
      "buildCommand": "npm install && npm run build",
      "startCommand": "npm run update-stats",
      "schedule": "0 6 * * *"
    }
  }' | jq .

echo ""
echo "=== Jobs criados! ==="
echo "Agora configure as variáveis de ambiente no dashboard do Render"
