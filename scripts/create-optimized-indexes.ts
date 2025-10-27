import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function createOptimizedIndexes() {
  try {
    console.log("🔧 Criando índices otimizados para queries de 90 dias...\n");

    // 1. Índice composto para otimizar JOIN e agregação
    console.log("1️⃣ Criando índice composto (first_open_at, post_id, email)...");
    await pixelPool.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pixel_composite_query
      ON pixel_tracking_optimized (first_open_at, post_id, email)
      WHERE first_open_at >= '2025-08-01';
    `);
    console.log("✅ Índice composto criado!");

    // 2. Índice BRIN para first_open_at (muito mais eficiente para range queries)
    console.log("\n2️⃣ Criando índice BRIN para first_open_at...");
    await pixelPool.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pixel_first_open_brin
      ON pixel_tracking_optimized USING BRIN (first_open_at)
      WITH (pages_per_range = 128);
    `);
    console.log("✅ Índice BRIN criado!");

    // 3. Índice para otimizar GROUP BY edition_type
    console.log("\n3️⃣ Criando índice para posts_metadata (edition_type, post_id)...");
    await pixelPool.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_edition_type_post_id
      ON posts_metadata (edition_type, post_id);
    `);
    console.log("✅ Índice para posts_metadata criado!");

    // 4. Analisar tabelas para atualizar estatísticas
    console.log("\n4️⃣ Atualizando estatísticas das tabelas...");
    await pixelPool.query(`ANALYZE pixel_tracking_optimized;`);
    await pixelPool.query(`ANALYZE posts_metadata;`);
    console.log("✅ Estatísticas atualizadas!");

    console.log("\n\n📊 Verificando índices criados:");
    const result = await pixelPool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('pixel_tracking_optimized', 'posts_metadata')
      ORDER BY tablename, indexname;
    `);

    result.rows.forEach((row) => {
      console.log(`\n  📌 ${row.indexname} (${row.tablename})`);
      console.log(`     ${row.indexdef}`);
    });

    await pixelPool.end();
    console.log("\n\n✅ Todos os índices criados com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro ao criar índices:", error);
    process.exit(1);
  }
}

createOptimizedIndexes();
