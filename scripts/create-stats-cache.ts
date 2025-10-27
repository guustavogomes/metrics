import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function createStatsCache() {
  try {
    console.log("🏗️  Criando cache de estatísticas...\n");

    // 1. Criar tabela de cache
    console.log("1️⃣ Criando tabela pixel_stats_cache...");
    await pixelPool.query(`
      CREATE TABLE IF NOT EXISTS pixel_stats_cache (
        period_days INTEGER NOT NULL,
        edition_type VARCHAR(20) NOT NULL,
        unique_readers BIGINT NOT NULL,
        total_opens BIGINT NOT NULL,
        calculated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (period_days, edition_type)
      );
    `);
    console.log("✅ Tabela criada!");

    // 2. Pré-calcular para 30, 60 e 90 dias
    const periods = [30, 60, 90];

    for (const days of periods) {
      console.log(`\n2️⃣ Calculando estatísticas para ${days} dias...`);
      const start = Date.now();

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

      const duration = Date.now() - start;
      console.log(`   ✅ ${days} dias: ${(duration / 1000).toFixed(2)}s`);
    }

    // 3. Verificar cache
    console.log("\n3️⃣ Verificando cache criado:");
    const result = await pixelPool.query(`
      SELECT * FROM pixel_stats_cache ORDER BY period_days, edition_type;
    `);

    result.rows.forEach((row) => {
      console.log(`\n  📌 ${row.period_days} dias - ${row.edition_type}:`);
      console.log(`     Unique readers: ${parseInt(row.unique_readers).toLocaleString()}`);
      console.log(`     Total opens: ${parseInt(row.total_opens).toLocaleString()}`);
      console.log(`     Calculado em: ${row.calculated_at}`);
    });

    // 4. Testar query com cache
    console.log("\n\n4️⃣ Testando query com cache (90 dias)...");
    const testStart = Date.now();

    const testResult = await pixelPool.query(`
      SELECT edition_type, unique_readers, total_opens
      FROM pixel_stats_cache
      WHERE period_days = 90
      ORDER BY edition_type;
    `);

    const testDuration = Date.now() - testStart;
    console.log(`   ✅ ${testDuration}ms`);
    console.log("   Resultado:", testResult.rows);

    console.log("\n\n✅ Cache de estatísticas criado com sucesso!");
    console.log(`⚡ Performance: ${testDuration}ms (vs 139s antes)`);

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  }
}

createStatsCache();
