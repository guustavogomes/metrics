# 🚀 Scripts - Guia Rápido

## 📋 2 Comandos Principais

### 1️⃣ Sincronizar Posts
**Quando usar:** Quando houver novos posts no Beehiiv

```bash
npx tsx scripts/sync-pixel-posts.ts
```

**O que faz:**
- Lê post_ids da tabela `pixel_tracking_optimized`
- Busca metadados dos posts na API Beehiiv
- Salva em `posts_metadata` (título, edition_type, publish_date, etc)

**Saída:**
```
✨ Synchronization completed!
✅ Synced: 12
⏭️  Skipped: 3
❌ Errors: 0

💡 PRÓXIMO PASSO:
   Para atualizar as estatísticas, execute:
   npx tsx scripts/update-all-stats.ts
```

---

### 2️⃣ Atualizar Estatísticas
**Quando usar:** Após sincronizar posts OU quando houver novos dados de pixel

```bash
npx tsx scripts/update-all-stats.ts
```

**O que faz (em cascata):**
1. ✅ Atualiza `pixel_daily_stats` (últimos 90 dias)
2. ✅ Atualiza `pixel_stats_cache` para 7 dias
3. ✅ Atualiza `pixel_stats_cache` para 30 dias
4. ✅ Atualiza `pixel_stats_cache` para 60 dias
5. ✅ Atualiza `pixel_stats_cache` para 90 dias

**Saída:**
```
═══════════════════════════════════════════════════════
🚀 ATUALIZAÇÃO COMPLETA DE ESTATÍSTICAS
═══════════════════════════════════════════════════════

📊 Atualizando pixel_daily_stats (últimos 90 dias)...
   ✅ Concluído em 155.34s

📈 Atualizando pixel_stats_cache (7 dias)...
   ✅ 7 dias: 38.50s
📈 Atualizando pixel_stats_cache (30 dias)...
   ✅ 30 dias: 94.04s
📈 Atualizando pixel_stats_cache (60 dias)...
   ✅ 60 dias: 137.12s
📈 Atualizando pixel_stats_cache (90 dias)...
   ✅ 90 dias: 149.83s

═══════════════════════════════════════════════════════
✅ ATUALIZAÇÃO COMPLETA COM SUCESSO!
═══════════════════════════════════════════════════════

📊 RESUMO DA ATUALIZAÇÃO:

✅ pixel_daily_stats: 155.34s

📈 pixel_stats_cache:
   ✅ 7 dias: 38.50s
   ✅ 30 dias: 94.04s
   ✅ 60 dias: 137.12s
   ✅ 90 dias: 149.83s

⏱️  Tempo total: 7.23 minutos

💡 PRÓXIMOS PASSOS:
   • Os caches estão atualizados
   • API retornará dados atualizados (após deploy)
   • Aguardar cache CDN expirar ou fazer novo deploy
```

**Tempo:** ~7 minutos

---

## 🔄 Fluxo Completo

```bash
# 1. Sincronizar posts do Beehiiv
npx tsx scripts/sync-pixel-posts.ts

# 2. Atualizar todas as estatísticas
npx tsx scripts/update-all-stats.ts
```

---

## 📅 Agendamento Semanal

Agende para rodar **todo domingo às 22:00**:

### Linux/macOS (cron)
```bash
crontab -e
```

Adicionar:
```
0 22 * * 0 cd /path/to/Metricas && npx tsx scripts/update-all-stats.ts
```

### Windows (Task Scheduler)
1. Abrir "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Nome: "Update Pixel Stats"
4. Gatilho: Semanal, Domingo 22:00
5. Ação: Iniciar programa
   - Programa: `cmd.exe`
   - Argumentos: `/c cd C:\Projetos\Metricas && npx tsx scripts/update-all-stats.ts`

---

## 🧪 Scripts de Teste (Desenvolvimento)

```bash
# Testar performance da API
npx tsx scripts/test-api-performance.ts

# Testar queries com 7 dias
npx tsx scripts/test-7-days.ts

# Adicionar cache de 7 dias (já feito, usar apenas em emergência)
npx tsx scripts/add-7-days-cache.ts
```

---

## 📊 Estrutura de Dados

```
pixel_tracking_optimized (fonte de dados de pixel)
         ↓
    sync-pixel-posts.ts (sincroniza metadados)
         ↓
    posts_metadata (metadados dos posts)
         ↓
    update-all-stats.ts (atualiza caches)
         ↓
    ┌─────────────────────┬──────────────────┐
    ↓                     ↓                  ↓
pixel_daily_stats   pixel_stats_cache    API
(agregação diária)  (7,30,60,90 dias)    (2-3s response)
```

---

## 🆘 Troubleshooting

### Cards aparecem zerados
```bash
# Verificar se caches existem
npx tsx scripts/test-7-days.ts

# Atualizar caches
npx tsx scripts/update-all-stats.ts
```

### Timeout na API
```bash
# Verificar performance
npx tsx scripts/test-api-performance.ts

# Recriar caches se necessário
npx tsx scripts/create-stats-cache.ts
```

### Sync não encontra posts
- Verificar se `BEEHIIV_API_KEY` está configurada no `.env`
- Verificar se posts existem em `pixel_tracking_optimized`

---

## 📖 Documentação Completa

- **Otimizações:** `OTIMIZACOES.md`
- **Atualização de Caches:** `ATUALIZACAO-CACHES.md`
- **Este Guia:** `README-SCRIPTS.md`

---

## ⚡ Resumo Rápido

**2 comandos, 2 tarefas:**

1. 📥 **Sincronizar:** `npx tsx scripts/sync-pixel-posts.ts`
2. 🔄 **Atualizar:** `npx tsx scripts/update-all-stats.ts`

Pronto! 🎉
