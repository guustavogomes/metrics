import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

/**
 * Script de atualização semanal dos caches
 * Execute este script todo domingo antes das 23:50
 * para garantir que os dados estejam atualizados quando o cache da Vercel expirar
 */
async function weeklyUpdateCache() {
  try {
    console.log("🔄 Iniciando atualização semanal dos caches...\n");
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`);

    const startTime = Date.now();

    // 1. Atualizar agregação diária
    console.log("1️⃣ Atualizando pixel_daily_stats (últimos 90 dias)...");
    const dailyStart = Date.now();

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

    const dailyDuration = Date.now() - dailyStart;
    console.log(`   ✅ Concluído em ${(dailyDuration / 1000).toFixed(2)}s`);

    // 2. Atualizar cache de estatísticas para 30, 60 e 90 dias
    const periods = [30, 60, 90];

    for (const days of periods) {
      console.log(`\n2️⃣ Atualizando pixel_stats_cache (${days} dias)...`);
      const statsStart = Date.now();

      await pixelPool.query(`
        INSERT INTO pixel_stats_cache (period_days, edition_type, unique_readers, total_opens)
        SELECT
          ${days} as period_days,
          pm.edition_type,
          COUNT(DISTINCT pt.email) as unique_readers,
          SUM(pt.open_count) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm USING (post_id)
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '2025-08-01'::timestamp
        GROUP BY pm.edition_type
        ON CONFLICT (period_days, edition_type)
        DO UPDATE SET
          unique_readers = EXCLUDED.unique_readers,
          total_opens = EXCLUDED.total_opens,
          calculated_at = NOW();
      `);

      const statsDuration = Date.now() - statsStart;
      console.log(`   ✅ ${days} dias: ${(statsDuration / 1000).toFixed(2)}s`);
    }

    const totalDuration = Date.now() - startTime;

    // 3. Verificar dados atualizados
    console.log("\n\n3️⃣ Verificando dados atualizados...");

    const dailyStatsResult = await pixelPool.query(`
      SELECT
        edition_type,
        COUNT(*) as days_count,
        MAX(updated_at) as last_update
      FROM pixel_daily_stats
      GROUP BY edition_type
      ORDER BY edition_type;
    `);

    console.log("\n📊 pixel_daily_stats:");
    dailyStatsResult.rows.forEach((row) => {
      console.log(`   ${row.edition_type}: ${row.days_count} dias (última atualização: ${row.last_update})`);
    });

    const cacheStatsResult = await pixelPool.query(`
      SELECT
        period_days,
        edition_type,
        unique_readers,
        calculated_at
      FROM pixel_stats_cache
      ORDER BY period_days, edition_type;
    `);

    console.log("\n📊 pixel_stats_cache:");
    cacheStatsResult.rows.forEach((row) => {
      console.log(`   ${row.period_days} dias - ${row.edition_type}: ${parseInt(row.unique_readers).toLocaleString()} readers (calculado em: ${row.calculated_at})`);
    });

    console.log("\n\n✅ Atualização semanal concluída com sucesso!");
    console.log(`⏱️  Tempo total: ${(totalDuration / 1000 / 60).toFixed(2)} minutos`);
    console.log(`\n💡 Próxima execução: Próximo domingo antes das 23:50`);

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro na atualização semanal:", error);
    process.exit(1);
  }
}

weeklyUpdateCache();
