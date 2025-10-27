import { updatePixelCaches } from "../lib/update-pixel-caches";

/**
 * Script de atualização semanal dos caches
 * Execute este script todo domingo antes das 23:50
 * para garantir que os dados estejam atualizados quando o cache da Vercel expirar
 *
 * Uso:
 *   npx tsx scripts/weekly-cache-update.ts
 */
async function weeklyUpdateCache() {
  try {
    console.log("🔄 Iniciando atualização semanal dos caches...\n");
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`);

    const result = await updatePixelCaches({
      periods: [7, 30, 60, 90],
      updateDaily: true,
      updateStats: true,
      daysToUpdate: 90,
      verbose: true,
    });

    if (result.success) {
      console.log("\n\n✅ Atualização semanal concluída com sucesso!");
      console.log(`⏱️  Tempo total: ${(result.duration / 1000 / 60).toFixed(2)} minutos`);
      console.log(`\n💡 Próxima execução: Próximo domingo antes das 23:50`);
    } else {
      console.warn("\n\n⚠️  Atualização concluída com alguns erros");
      console.log("Verifique os logs acima para detalhes");
    }
  } catch (error) {
    console.error("\n❌ Erro na atualização semanal:", error);
    process.exit(1);
  }
}

weeklyUpdateCache();
