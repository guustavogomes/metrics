import { updatePixelCaches } from "../lib/update-pixel-caches";

/**
 * 🚀 SCRIPT MASTER - Atualiza TODAS as estatísticas em cascata
 *
 * Execute após sincronizar novos dados de pixel ou posts.
 * Atualiza tudo automaticamente em sequência.
 *
 * Uso:
 *   npx tsx scripts/update-all-stats.ts
 *
 * O que faz:
 *   1. Atualiza pixel_daily_stats (últimos 90 dias)
 *   2. Atualiza pixel_stats_cache (7, 30, 60, 90 dias)
 *   3. Mostra progresso de cada etapa
 *
 * Tempo estimado: ~7 minutos
 */
async function updateAllStats() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🚀 ATUALIZAÇÃO COMPLETA DE ESTATÍSTICAS");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

  const totalStart = Date.now();

  try {
    // Atualizar tudo em cascata
    const result = await updatePixelCaches({
      periods: [7, 30, 60, 90],
      updateDaily: true,
      updateStats: true,
      daysToUpdate: 90,
      verbose: true,
    });

    const totalDuration = Date.now() - totalStart;

    console.log("\n═══════════════════════════════════════════════════════");

    if (result.success) {
      console.log("✅ ATUALIZAÇÃO COMPLETA COM SUCESSO!");
    } else {
      console.log("⚠️  ATUALIZAÇÃO CONCLUÍDA COM ALGUNS ERROS");
    }

    console.log("═══════════════════════════════════════════════════════\n");

    // Resumo detalhado
    console.log("📊 RESUMO DA ATUALIZAÇÃO:\n");

    // Daily Stats
    if (result.dailyStats) {
      if (result.dailyStats.updated) {
        console.log(`✅ pixel_daily_stats: ${(result.dailyStats.duration / 1000).toFixed(2)}s`);
      } else {
        console.log(`❌ pixel_daily_stats: ERRO - ${result.dailyStats.error}`);
      }
    }

    // Stats Cache por período
    if (result.statsCache?.periods) {
      console.log("\n📈 pixel_stats_cache:");
      result.statsCache.periods.forEach(period => {
        if (period.updated) {
          console.log(`   ✅ ${period.days} dias: ${(period.duration / 1000).toFixed(2)}s`);
        } else {
          console.log(`   ❌ ${period.days} dias: ERRO - ${period.error}`);
        }
      });
    }

    console.log(`\n⏱️  Tempo total: ${(totalDuration / 1000 / 60).toFixed(2)} minutos`);
    console.log(`📅 Finalizado em: ${new Date().toLocaleString('pt-BR')}`);

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("💡 PRÓXIMOS PASSOS:");
    console.log("   • Os caches estão atualizados");
    console.log("   • API retornará dados atualizados (após deploy)");
    console.log("   • Aguardar cache CDN expirar ou fazer novo deploy");
    console.log("═══════════════════════════════════════════════════════\n");

    // Exit code baseado no sucesso
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    const totalDuration = Date.now() - totalStart;

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("❌ ERRO FATAL NA ATUALIZAÇÃO");
    console.log("═══════════════════════════════════════════════════════\n");
    console.error("Detalhes do erro:", error);
    console.log(`\n⏱️  Tempo até erro: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log("\n💡 TROUBLESHOOTING:");
    console.log("   • Verificar conexão com banco de dados");
    console.log("   • Verificar se tabelas existem (pixel_daily_stats, pixel_stats_cache)");
    console.log("   • Verificar logs acima para detalhes");
    console.log("═══════════════════════════════════════════════════════\n");

    process.exit(1);
  }
}

// Executar
updateAllStats();
