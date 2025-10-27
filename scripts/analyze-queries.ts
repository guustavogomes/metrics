import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

const days = 90;
const dataStartDate = '2025-08-01';

async function analyzeQueries() {
  try {
    console.log("🔍 Analisando query de estatísticas (90 dias)...\n");

    const statsQuery = `
      EXPLAIN ANALYZE
      SELECT
        pm.edition_type,
        COUNT(DISTINCT pt.email) as unique_readers,
        SUM(pt.open_count) as total_opens,
        AVG(pt.open_count) as avg_opens_per_reader
      FROM pixel_tracking_optimized pt
      JOIN posts_metadata pm ON pt.post_id = pm.post_id
      WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
        AND pt.first_open_at >= '${dataStartDate}'
      GROUP BY pm.edition_type
    `;

    const result1 = await pixelPool.query(statsQuery);
    console.log("📊 Stats Query:");
    result1.rows.forEach(row => console.log(row["QUERY PLAN"]));

    console.log("\n\n🔍 Analisando query diária (90 dias)...\n");

    const dailyQuery = `
      EXPLAIN ANALYZE
      SELECT
        DATE(pt.first_open_at) as date,
        pm.edition_type,
        COUNT(DISTINCT pt.email) as unique_readers,
        SUM(pt.open_count) as total_opens
      FROM pixel_tracking_optimized pt
      JOIN posts_metadata pm ON pt.post_id = pm.post_id
      WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
        AND pt.first_open_at >= '${dataStartDate}'
      GROUP BY DATE(pt.first_open_at), pm.edition_type
      ORDER BY date
    `;

    const result2 = await pixelPool.query(dailyQuery);
    console.log("📊 Daily Query:");
    result2.rows.forEach(row => console.log(row["QUERY PLAN"]));

    console.log("\n\n📈 Estatísticas da tabela:");
    const countResult = await pixelPool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(DISTINCT post_id) as unique_posts,
        MIN(first_open_at) as min_date,
        MAX(first_open_at) as max_date
      FROM pixel_tracking_optimized
      WHERE first_open_at >= NOW() - INTERVAL '${days} days'
    `);
    console.log(countResult.rows[0]);

    await pixelPool.end();
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

analyzeQueries();
