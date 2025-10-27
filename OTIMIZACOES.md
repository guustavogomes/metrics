# Otimizações de Performance - API Pixel Stats

## 📊 Resultados

### Performance Antes vs Depois
| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Tempo Total (90 dias)** | ~140s | **2.14s** | **65x mais rápido** |
| Stats Query | 140s | 1.41s | 99x |
| Daily Query | 113s | 233ms | 485x |
| Weekday Query | - | 238ms | - |
| Comparison Query | 148s | 260ms | 569x |

## 🔧 Otimizações Implementadas

### 1. Tabela de Agregação Diária
```sql
CREATE TABLE pixel_daily_stats (
  date DATE NOT NULL,
  edition_type VARCHAR(20) NOT NULL,
  unique_readers BIGINT NOT NULL,
  total_opens BIGINT NOT NULL,
  day_of_week SMALLINT NOT NULL,
  PRIMARY KEY (date, edition_type)
);
```

**Benefícios:**
- Queries diárias e de weekday são instantâneas (~250ms)
- Pré-calcula contagens de unique readers por dia
- Elimina necessidade de COUNT(DISTINCT) em queries diárias

### 2. Cache de Estatísticas por Período
```sql
CREATE TABLE pixel_stats_cache (
  period_days INTEGER NOT NULL,
  edition_type VARCHAR(20) NOT NULL,
  unique_readers BIGINT NOT NULL,
  total_opens BIGINT NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (period_days, edition_type)
);
```

**Benefícios:**
- Stats Query reduzida de 140s para 1.41s
- Pré-calcula unique readers para 30, 60 e 90 dias
- Atualizado semanalmente

### 3. Índices Otimizados

#### Índice Composto Parcial
```sql
CREATE INDEX idx_pixel_composite_query
ON pixel_tracking_optimized (first_open_at, post_id, email)
WHERE first_open_at >= '2025-08-01';
```

#### Índice BRIN para Range Queries
```sql
CREATE INDEX idx_pixel_first_open_brin
ON pixel_tracking_optimized USING BRIN (first_open_at)
WITH (pages_per_range = 128);
```

#### Índice para Posts
```sql
CREATE INDEX idx_posts_edition_type_post_id
ON posts_metadata (edition_type, post_id);
```

## 🔄 Manutenção

### Atualização Semanal dos Caches
Execute **todo domingo antes das 23:50** (antes do cache da Vercel expirar):

```bash
npm run update-cache
# ou
npx tsx scripts/weekly-cache-update.ts
```

Este script:
1. Atualiza `pixel_daily_stats` (últimos 90 dias)
2. Atualiza `pixel_stats_cache` (30, 60 e 90 dias)
3. Leva aproximadamente **6-8 minutos**

### Criar Tabelas Inicialmente
```bash
# Criar agregação diária
npx tsx scripts/create-daily-aggregation.ts

# Criar cache de estatísticas
npx tsx scripts/create-stats-cache.ts

# Criar índices otimizados
npx tsx scripts/create-optimized-indexes.ts
```

## 📈 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  API /api/pixel/stats                    │
│                   (Timeout: 300s)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌─────────────────┐
│ pixel_stats_ │ │ pixel_   │ │ pixel_tracking_ │
│ cache        │ │ daily_   │ │ optimized       │
│              │ │ stats    │ │ (24M registros) │
│ (9 rows)     │ │ (~90     │ │                 │
│ ~1ms         │ │ rows)    │ │ Apenas para     │
│              │ │ ~250ms   │ │ comparison      │
└──────────────┘ └──────────┘ └─────────────────┘
```

## ⚠️ Notas Importantes

1. **Cache da Vercel**: A API usa cache HTTP que expira todo domingo às 23:50
2. **Atualização**: Execute o script de atualização **antes** do cache expirar
3. **Períodos Suportados**: 7, 30, 60 e 90 dias (definidos em `pixel_stats_cache`)
4. **Dados Históricos**: Começam em 2025-08-01

## 🚀 Scripts Disponíveis

| Script | Descrição | Tempo |
|--------|-----------|-------|
| `create-daily-aggregation.ts` | Cria tabela de agregação diária | ~3 min |
| `create-stats-cache.ts` | Cria cache de estatísticas | ~7 min |
| `create-optimized-indexes.ts` | Cria índices otimizados | ~30s |
| `weekly-cache-update.ts` | Atualiza todos os caches | ~7 min |
| `test-api-performance.ts` | Testa performance da API | ~3s |
| `update-daily-stats.ts` | Atualiza apenas daily stats | ~3 min |

## 📝 Troubleshooting

### API ainda dando timeout?
1. Verifique se as tabelas de cache existem:
   ```sql
   SELECT * FROM pixel_stats_cache WHERE period_days = 90;
   SELECT COUNT(*) FROM pixel_daily_stats;
   ```

2. Execute o script de atualização:
   ```bash
   npx tsx scripts/weekly-cache-update.ts
   ```

### Cache desatualizado?
Execute o script de atualização semanal antes do domingo 23:50.

### Novos dados não aparecem?
O cache da Vercel CDN mantém os dados até domingo 23:50. Aguarde a expiração ou force um novo deploy.
