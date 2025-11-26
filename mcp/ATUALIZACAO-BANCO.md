# 🔄 Comandos para Atualizar Banco e Estatísticas

## 📋 Comandos Principais

### 1. **Sincronizar Posts do Beehiiv** (Atualiza metadados)

```bash
npx tsx scripts/sync-pixel-posts.ts
```

**O que faz:**
- Busca metadados dos posts na API Beehiiv
- Atualiza tabela `posts_metadata` (título, edition_type, etc)
- **Atualiza caches automaticamente** se houver novos posts sincronizados

**Quando usar:**
- Quando houver novos posts publicados
- Para atualizar informações de posts existentes

---

### 2. **Atualizar Todas as Estatísticas** (Recomendado)

```bash
npx tsx scripts/update-all-stats.ts
```

**O que faz:**
1. ✅ Atualiza `pixel_daily_stats` (últimos 90 dias)
2. ✅ Atualiza `pixel_stats_cache` para 7 dias
3. ✅ Atualiza `pixel_stats_cache` para 30 dias
4. ✅ Atualiza `pixel_stats_cache` para 60 dias
5. ✅ Atualiza `pixel_stats_cache` para 90 dias

**Tempo estimado:** ~7 minutos

**Quando usar:**
- Após sincronizar posts
- Quando houver novos dados de pixel
- Quando os dados parecerem desatualizados

---

### 3. **Atualização Semanal** (Manutenção)

```bash
npx tsx scripts/weekly-cache-update.ts
```

**O que faz:**
- Mesma coisa que `update-all-stats.ts`
- Otimizado para execução semanal

**Quando usar:**
- **Todo domingo antes das 23:50**
- Manutenção preventiva
- Garantir dados atualizados para a semana

---

## 🔧 Comandos Específicos (Avançado)

### Atualizar Apenas Daily Stats

```bash
npx tsx scripts/update-daily-stats.ts
```

**O que faz:**
- Atualiza apenas `pixel_daily_stats` (últimos 90 dias)
- Não atualiza `pixel_stats_cache`

---

### Atualizar Apenas Overlap Cache

```bash
npx tsx scripts/update-overlap-cache.ts
```

**O que faz:**
- Atualiza apenas cache de overlap de leitores

---

## 🌐 Atualização via API (Produção)

### Atualizar Tudo

```bash
curl "https://metrics-silk.vercel.app/api/pixel/update-cache"
```

### Atualizar Períodos Específicos

```bash
# Apenas 7 e 30 dias
curl "https://metrics-silk.vercel.app/api/pixel/update-cache?periods=7,30"

# Apenas daily stats
curl "https://metrics-silk.vercel.app/api/pixel/update-cache?updateStats=false"

# Apenas stats cache
curl "https://metrics-silk.vercel.app/api/pixel/update-cache?updateDaily=false"
```

**Query Parameters:**
- `periods`: Períodos para atualizar (ex: "7,30,60,90")
- `updateDaily`: Atualizar `pixel_daily_stats` (default: true)
- `updateStats`: Atualizar `pixel_stats_cache` (default: true)
- `daysToUpdate`: Quantos dias atualizar (default: 90)

---

## 📅 Fluxo Recomendado

### Rotina Diária/Semanal

```bash
# 1. Sincronizar posts (se houver novos)
npx tsx scripts/sync-pixel-posts.ts

# 2. Atualizar estatísticas (se necessário)
npx tsx scripts/update-all-stats.ts
```

### Rotina Semanal (Domingo)

```bash
# Todo domingo antes das 23:50
npx tsx scripts/weekly-cache-update.ts
```

---

## ⚡ Comandos Rápidos (npm scripts)

Você pode adicionar ao `package.json`:

```json
{
  "scripts": {
    "sync-pixel": "tsx scripts/sync-pixel-posts.ts",
    "update-stats": "tsx scripts/update-all-stats.ts",
    "update-weekly": "tsx scripts/weekly-cache-update.ts"
  }
}
```

Depois usar:
```bash
npm run sync-pixel
npm run update-stats
npm run update-weekly
```

---

## 📊 O que cada tabela armazena

### `pixel_daily_stats`
- Agregação diária de leitores únicos
- Total de aberturas por dia
- Dia da semana
- **Atualizado:** Últimos 90 dias

### `pixel_stats_cache`
- Cache pré-calculado por período (7, 30, 60, 90 dias)
- Leitores únicos por edição
- **Atualizado:** Períodos específicos

### `pixel_overlap_cache`
- Cache de sobreposição de leitores
- Leitores que leem ambas edições
- **Atualizado:** Por período

---

## ⚠️ Importante

1. **Tempo de execução:** Atualizações completas levam ~7 minutos
2. **Cache da Vercel:** Expira domingo às 23:50 - atualize antes!
3. **Sincronização automática:** `sync-pixel-posts.ts` já atualiza caches se houver novos posts
4. **Performance:** Use `update-all-stats.ts` para atualização completa

---

## 🐛 Troubleshooting

**Dados desatualizados?**
```bash
npx tsx scripts/update-all-stats.ts
```

**Erro ao atualizar?**
- Verifique conexão com banco
- Verifique se há espaço em disco
- Verifique logs de erro

**Cache não atualizando?**
- Execute manualmente: `npx tsx scripts/update-all-stats.ts`
- Aguarde alguns minutos após execução
- Limpe cache do navegador se necessário

---

**Última atualização:** 6 de novembro de 2025

