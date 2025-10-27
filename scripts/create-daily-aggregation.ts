import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function createDailyAggregation() {
  try {
    console.log("🏗️  Criando tabela de agregação diária...\n");

    // 1. Criar tabela de agregação diária
    console.log("1️⃣ Criando tabela pixel_daily_stats...");
    await pixelPool.query(`
      CREATE TABLE IF NOT EXISTS pixel_daily_stats (
        date DATE NOT NULL,
        edition_type VARCHAR(20) NOT NULL,
        unique_readers BIGINT NOT NULL,
        total_opens BIGINT NOT NULL,
        day_of_week SMALLINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (date, edition_type)
      );
    `);
    console.log("✅ Tabela criada!");

    // 2. Criar índices
    console.log("\n2️⃣ Criando índices...");
    await pixelPool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_stats_date
      ON pixel_daily_stats (date DESC);
    `);
    await pixelPool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_stats_edition_date
      ON pixel_daily_stats (edition_type, date DESC);
    `);
    await pixelPool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_stats_dow
      ON pixel_daily_stats (day_of_week, edition_type);
    `);
    console.log("✅ Índices criados!");

    // 3. Popular com dados históricos
    console.log("\n3️⃣ Populando com dados históricos (pode demorar)...");
    const startPopulate = Date.now();

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
      WHERE pt.first_open_at >= '2025-08-01'::timestamp
      GROUP BY DATE(pt.first_open_at), pm.edition_type
      ON CONFLICT (date, edition_type)
      DO UPDATE SET
        unique_readers = EXCLUDED.unique_readers,
        total_opens = EXCLUDED.total_opens,
        day_of_week = EXCLUDED.day_of_week,
        updated_at = NOW();
    `);

    const populateTime = Date.now() - startPopulate;
    console.log(`✅ Dados populados em ${(populateTime / 1000).toFixed(2)}s`);

    // 4. Verificar dados
    console.log("\n4️⃣ Verificando dados...");
    const countResult = await pixelPool.query(`
      SELECT
        edition_type,
        COUNT(*) as days_count,
        SUM(unique_readers) as total_unique_readers,
        SUM(total_opens) as total_opens,
        MIN(date) as first_date,
        MAX(date) as last_date
      FROM pixel_daily_stats
      GROUP BY edition_type
      ORDER BY edition_type;
    `);

    console.log("\n📊 Estatísticas da tabela:");
    countResult.rows.forEach((row) => {
      console.log(`\n  📌 ${row.edition_type}:`);
      console.log(`     Dias: ${row.days_count}`);
      console.log(`     Total unique readers: ${parseInt(row.total_unique_readers).toLocaleString()}`);
      console.log(`     Total opens: ${parseInt(row.total_opens).toLocaleString()}`);
      console.log(`     Período: ${row.first_date} até ${row.last_date}`);
    });

    // 5. Testar performance de query na nova tabela
    console.log("\n\n5️⃣ Testando performance de query (90 dias)...");
    const startTest = Date.now();

    const testResult = await pixelPool.query(`
      SELECT
        edition_type,
        SUM(unique_readers) as total_unique_readers,
        SUM(total_opens) as total_opens,
        AVG(unique_readers) as avg_unique_readers_per_day
      FROM pixel_daily_stats
      WHERE date >= NOW() - INTERVAL '90 days'
      GROUP BY edition_type;
    `);

    const testTime = Date.now() - startTest;
    console.log(`✅ Query executada em ${testTime}ms`);
    console.log("\n📊 Resultado:");
    testResult.rows.forEach((row) => {
      console.log(`  ${row.edition_type}: ${parseInt(row.total_unique_readers).toLocaleString()} readers, ${parseInt(row.total_opens).toLocaleString()} opens`);
    });

    console.log("\n\n✅ Tabela de agregação criada e populada com sucesso!");
    console.log(`⚡ Performance: ${testTime}ms (vs ~140s antes)`);

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  }
}

createDailyAggregation();
