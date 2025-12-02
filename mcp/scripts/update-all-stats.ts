import { updatePixelCaches } from "../lib/update-pixel-caches";

/**
 * Script para atualizar TODAS as estatísticas
 * Executado via cron job no Render
 */
async function updateAllStats() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🚀 ATUALIZAÇÃO COMPLETA DE ESTATÍSTICAS");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`📅 Iniciado em: ${new Date().toISOString()}\n`);

  const totalStart = Date.now();

  try {
    const result = await updatePixelCaches({
      periods: [7, 30, 60, 90],
      updateDaily: true,
      updateStats: true,
      updateOverlap: true,
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

    console.log(`⏱️  Tempo total: ${(totalDuration / 1000 / 60).toFixed(2)} minutos`);
    console.log(`📅 Finalizado em: ${new Date().toISOString()}`);

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("❌ ERRO FATAL:", error);
    process.exit(1);
  }
}

updateAllStats();
