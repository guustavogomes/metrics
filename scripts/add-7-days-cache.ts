import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function add7DaysCache() {
  try {
    console.log("🔄 Adicionando cache para 7 dias...\n");

    // Adicionar 7 dias ao cache
    console.log("1️⃣ Calculando estatísticas para 7 dias...");
    const start = Date.now();

    await pixelPool.query(`
      INSERT INTO pixel_stats_cache (period_days, edition_type, unique_readers, total_opens)
      SELECT
        7 as period_days,
        pm.edition_type,
        COUNT(DISTINCT pt.email) as unique_readers,
        SUM(pt.open_count) as total_opens
      FROM pixel_tracking_optimized pt
      INNER JOIN posts_metadata pm USING (post_id)
      WHERE pt.first_open_at >= NOW() - INTERVAL '7 days'
        AND pt.first_open_at >= '2025-08-01'::timestamp
      GROUP BY pm.edition_type
      ON CONFLICT (period_days, edition_type)
      DO UPDATE SET
        unique_readers = EXCLUDED.unique_readers,
        total_opens = EXCLUDED.total_opens,
        calculated_at = NOW();
    `);

    const duration = Date.now() - start;
    console.log(`   ✅ 7 dias: ${(duration / 1000).toFixed(2)}s`);

    // Verificar cache
    console.log("\n2️⃣ Verificando cache criado:");
    const result = await pixelPool.query(`
      SELECT * FROM pixel_stats_cache WHERE period_days = 7 ORDER BY edition_type;
    `);

    result.rows.forEach((row) => {
      console.log(`\n  📌 ${row.period_days} dias - ${row.edition_type}:`);
      console.log(`     Unique readers: ${parseInt(row.unique_readers).toLocaleString()}`);
      console.log(`     Total opens: ${parseInt(row.total_opens).toLocaleString()}`);
      console.log(`     Calculado em: ${row.calculated_at}`);
    });

    // Verificar todos os períodos disponíveis
    console.log("\n\n3️⃣ Todos os períodos disponíveis:");
    const allPeriods = await pixelPool.query(`
      SELECT DISTINCT period_days FROM pixel_stats_cache ORDER BY period_days;
    `);
    console.log("   Períodos:", allPeriods.rows.map(r => r.period_days + " dias").join(", "));

    console.log("\n\n✅ Cache de 7 dias adicionado com sucesso!");

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  }
}

add7DaysCache();
