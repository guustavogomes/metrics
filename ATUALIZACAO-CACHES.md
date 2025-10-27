# Atualização de Caches - Pixel Stats

## 🔄 Como Funciona

O sistema possui **3 formas** de atualizar os caches de estatísticas:

### 1. Automática (após sincronização) ✅ RECOMENDADO

Quando você sincroniza posts do Beehiiv, os caches são atualizados automaticamente:

```bash
npx tsx scripts/sync-pixel-posts.ts
```

**O que acontece:**
1. Sincroniza metadados dos posts da Beehiiv → `posts_metadata`
2. Se houver posts sincronizados (synced > 0):
   - ✅ Atualiza `pixel_daily_stats` (últimos 90 dias)
   - ✅ Atualiza `pixel_stats_cache` (7, 30, 60, 90 dias)
3. Exibe tempo total e resultado

**Exemplo de saída:**
```
✨ Synchronization completed!
✅ Synced: 12
⏭️  Skipped: 3
❌ Errors: 0

🔄 Updating pixel caches...
📊 Atualizando pixel_daily_stats (últimos 90 dias)...
   ✅ Concluído em 155.34s
📈 Atualizando pixel_stats_cache (7 dias)...
   ✅ 7 dias: 38.50s
...

✅ Caches updated successfully in 6.45 minutes
```

### 2. Manual via Script

Execute manualmente quando necessário:

```bash
npx tsx scripts/weekly-cache-update.ts
```

**Quando usar:**
- Todo domingo antes das 23:50 (antes do cache da Vercel expirar)
- Após sincronização manual de dados de pixel
- Quando os dados parecerem desatualizados

**Tempo estimado:** ~7 minutos

### 3. Manual via API

Chame o endpoint para atualizar via HTTP:

```bash
# Atualizar tudo (padrão)
curl "https://metrics-silk.vercel.app/api/pixel/update-cache"

# Atualizar apenas períodos específicos
curl "https://metrics-silk.vercel.app/api/pixel/update-cache?periods=7,30"

# Atualizar apenas daily stats
curl "https://metrics-silk.vercel.app/api/pixel/update-cache?updateStats=false"

# Atualizar apenas stats cache
curl "https://metrics-silk.vercel.app/api/pixel/update-cache?updateDaily=false"
```

**Query Parameters:**
- `periods`: Períodos para atualizar (ex: "7,30,60,90")
- `updateDaily`: Se deve atualizar `pixel_daily_stats` (default: true)
- `updateStats`: Se deve atualizar `pixel_stats_cache` (default: true)
- `daysToUpdate`: Quantos dias atualizar no daily_stats (default: 90)

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Caches updated successfully",
  "duration": 385420,
  "details": {
    "dailyStats": {
      "updated": true,
      "duration": 155340
    },
    "statsCache": {
      "periods": [
        { "days": 7, "updated": true, "duration": 38500 },
        { "days": 30, "updated": true, "duration": 94040 },
        { "days": 60, "updated": true, "duration": 137120 },
        { "days": 90, "updated": true, "duration": 149830 }
      ]
    }
  }
}
```

## 📊 O Que é Atualizado

### pixel_daily_stats
**Agregação diária de estatísticas**

```sql
-- Estrutura
CREATE TABLE pixel_daily_stats (
  date DATE,
  edition_type VARCHAR(20),
  unique_readers BIGINT,
  total_opens BIGINT,
  day_of_week SMALLINT,
  PRIMARY KEY (date, edition_type)
);
```

**Usado por:**
- Daily Query (~250ms)
- Weekday Query (~250ms)
- Comparison Query (~250ms)

**Atualização:** Últimos 90 dias

### pixel_stats_cache
**Cache de unique readers por período**

```sql
-- Estrutura
CREATE TABLE pixel_stats_cache (
  period_days INTEGER,
  edition_type VARCHAR(20),
  unique_readers BIGINT,
  total_opens BIGINT,
  calculated_at TIMESTAMP,
  PRIMARY KEY (period_days, edition_type)
);
```

**Usado por:**
- Stats Query (~1.5s)

**Períodos:** 7, 30, 60, 90 dias

## 🔧 Módulo Reutilizável

O módulo `lib/update-pixel-caches.ts` é usado por todos os métodos:

```typescript
import { updatePixelCaches } from "@/lib/update-pixel-caches";

const result = await updatePixelCaches({
  periods: [7, 30, 60, 90],     // Períodos a atualizar
  updateDaily: true,             // Atualizar daily stats
  updateStats: true,             // Atualizar stats cache
  daysToUpdate: 90,              // Dias de daily stats
  verbose: true,                 // Logs detalhados
  pool: existingPool,            // Pool opcional (cria novo se não fornecido)
});

if (result.success) {
  console.log(`Updated in ${result.duration}ms`);
}
```

## ⏰ Agendamento Automático

### Opção 1: Cron Job (Linux/macOS)

```bash
# Editar crontab
crontab -e

# Adicionar linha para rodar todo domingo às 22:00
0 22 * * 0 cd /path/to/Metricas && npx tsx scripts/weekly-cache-update.ts >> /var/log/pixel-cache-update.log 2>&1
```

### Opção 2: Task Scheduler (Windows)

1. Abrir "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Nome: "Pixel Cache Update"
4. Gatilho: Semanal, Domingo 22:00
5. Ação: Iniciar programa
   - Programa: `cmd.exe`
   - Argumentos: `/c cd C:\Projetos\Metricas && npx tsx scripts/weekly-cache-update.ts`

### Opção 3: Vercel Cron Jobs

Adicionar em `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/pixel/update-cache",
    "schedule": "0 22 * * 0"
  }]
}
```

## 🚨 Troubleshooting

### Caches não atualizaram após sync
```bash
# Verificar se sync teve sucesso
npx tsx scripts/sync-pixel-posts.ts

# Se "Synced: 0", não houve novos posts
# Se houve erro, rodar manualmente:
npx tsx scripts/weekly-cache-update.ts
```

### Dados parecem desatualizados
```bash
# Verificar última atualização
psql -h 24.144.88.69 -U waffle -d waffle_metrics -c "
  SELECT period_days, edition_type, calculated_at
  FROM pixel_stats_cache
  ORDER BY calculated_at DESC LIMIT 5;
"

# Forçar atualização
npx tsx scripts/weekly-cache-update.ts
```

### API retorna erro 500
```bash
# Verificar logs
# Rodar localmente para ver erro detalhado
npx tsx scripts/weekly-cache-update.ts
```

### Cache da Vercel não expira
```bash
# Forçar novo deploy
git commit --allow-empty -m "Force cache refresh"
git push

# Ou aguardar até domingo 23:50
```

## 📋 Checklist de Manutenção

- [ ] **Semanal** (Domingo 22:00): Rodar `weekly-cache-update.ts`
- [ ] **Após sync manual**: Verificar se caches foram atualizados
- [ ] **Após novos dados**: Rodar update-cache via API ou script
- [ ] **Mensal**: Verificar se agendamento automático está funcionando

## 📊 Métricas de Performance

### Tempo de Atualização (por componente)

| Componente | Tempo Médio | Tabela | Registros |
|------------|-------------|--------|-----------|
| Daily Stats (90d) | ~2.5 min | pixel_daily_stats | ~270 rows |
| Stats Cache 7d | ~40s | pixel_stats_cache | 3 rows |
| Stats Cache 30d | ~1.5 min | pixel_stats_cache | 3 rows |
| Stats Cache 60d | ~2.3 min | pixel_stats_cache | 3 rows |
| Stats Cache 90d | ~2.5 min | pixel_stats_cache | 3 rows |
| **TOTAL** | **~7 min** | - | - |

### Frequência de Atualização

| Cenário | Frequência | Método |
|---------|------------|--------|
| **Produção normal** | Semanal (domingo 22h) | Script agendado |
| **Após sync posts** | Automática | Integrado no sync |
| **Manual (emergência)** | Sob demanda | API ou script |

## 🔗 Links Úteis

- Documentação geral: `OTIMIZACOES.md`
- Módulo de atualização: `lib/update-pixel-caches.ts`
- Script semanal: `scripts/weekly-cache-update.ts`
- Script de sync: `scripts/sync-pixel-posts.ts`
- API endpoint: `app/api/pixel/update-cache/route.ts`
