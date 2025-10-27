import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

/**
 * Script para atualizar a tabela de agregação diária
 * Deve ser executado semanalmente (antes do cache expirar)
 */
async function updateDailyStats() {
  try {
    console.log("🔄 Atualizando tabela de agregação diária...\n");
    const startTime = Date.now();

    // Atualizar ou inserir dados dos últimos 90 dias
    console.log("📊 Processando dados dos últimos 90 dias...");
    await pixelPool.query(`
      INSERT INTO pixel_daily_stats (date, edition_type, unique_readers, total_opens, day_of_week)
      SELECT
        DATE(pt.first_open_at) as date,
        pm.edition_type,
        COUNT(DISTINCT pt.email) as unique_readers,
        SUM(pt.open_count) as total_opens,
        EXTRACT(DOW FROM DATE(pt.first_open_at)) as day_of_week
      FROM pixel_tracking_optimized pt
      INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
      WHERE pt.first_open_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(pt.first_open_at), pm.edition_type
      ON CONFLICT (date, edition_type)
      DO UPDATE SET
        unique_readers = EXCLUDED.unique_readers,
        total_opens = EXCLUDED.total_opens,
        day_of_week = EXCLUDED.day_of_week,
        updated_at = NOW();
    `);

    const duration = Date.now() - startTime;
    console.log(`✅ Agregação atualizada em ${(duration / 1000).toFixed(2)}s\n`);

    // Verificar dados atualizados
    const statsResult = await pixelPool.query(`
      SELECT
        edition_type,
        COUNT(*) as days_count,
        MIN(date) as first_date,
        MAX(date) as last_date,
        MAX(updated_at) as last_update
      FROM pixel_daily_stats
      GROUP BY edition_type
      ORDER BY edition_type;
    `);

    console.log("📊 Estatísticas atualizadas:");
    statsResult.rows.forEach((row) => {
      console.log(`\n  📌 ${row.edition_type}:`);
      console.log(`     Dias: ${row.days_count}`);
      console.log(`     Período: ${row.first_date} até ${row.last_date}`);
      console.log(`     Última atualização: ${row.last_update}`);
    });

    await pixelPool.end();
    console.log("\n\n✅ Atualização concluída com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro ao atualizar agregação:", error);
    process.exit(1);
  }
}

updateDailyStats();
