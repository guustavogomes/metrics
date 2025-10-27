import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function enableParallelQueries() {
  try {
    console.log("⚡ Configurando PostgreSQL para queries paralelas...\n");

    // Habilitar execução paralela para queries pesadas
    await pixelPool.query(`SET max_parallel_workers_per_gather = 4;`);
    await pixelPool.query(`SET parallel_setup_cost = 100;`);
    await pixelPool.query(`SET parallel_tuple_cost = 0.01;`);
    await pixelPool.query(`SET min_parallel_table_scan_size = '8MB';`);

    console.log("✅ Configurações aplicadas!");

    console.log("\n🧪 Testando Stats Query com paralelização...");
    const start = Date.now();

    const result = await pixelPool.query(`
      EXPLAIN ANALYZE
      SELECT
        pm.edition_type,
        COUNT(DISTINCT pt.email) as unique_readers
      FROM pixel_tracking_optimized pt
      INNER JOIN posts_metadata pm USING (post_id)
      WHERE pt.first_open_at >= GREATEST(
        NOW() - INTERVAL '90 days',
        '2025-08-01'::timestamp
      )
      GROUP BY pm.edition_type
    `);

    const duration = Date.now() - start;

    console.log("\n📊 Plano de execução:");
    result.rows.forEach(row => console.log(row["QUERY PLAN"]));

    console.log(`\n⏱️  Tempo: ${(duration / 1000).toFixed(2)}s`);

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  }
}

enableParallelQueries();
