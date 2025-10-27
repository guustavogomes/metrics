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

async function testQueries() {
  try {
    console.log("🧪 Testando queries otimizadas (90 dias)...\n");

    // Query otimizada de estatísticas
    console.log("1️⃣ Testando query de estatísticas...");
    const startStats = Date.now();

    const statsQuery = `
      WITH filtered_data AS (
        SELECT pt.email, pt.open_count, pm.edition_type
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${dataStartDate}'::timestamp
      )
      SELECT
        edition_type,
        COUNT(DISTINCT email) as unique_readers,
        SUM(open_count) as total_opens,
        AVG(open_count) as avg_opens_per_reader
      FROM filtered_data
      GROUP BY edition_type
    `;

    const statsResult = await pixelPool.query(statsQuery);
    const statsTime = Date.now() - startStats;
    console.log(`   ✅ Concluído em ${(statsTime / 1000).toFixed(2)}s`);
    console.log("   Resultado:", statsResult.rows);

    // Query otimizada diária
    console.log("\n2️⃣ Testando query diária...");
    const startDaily = Date.now();

    const dailyQuery = `
      WITH filtered_data AS (
        SELECT
          DATE(pt.first_open_at) as date,
          pt.email,
          pt.open_count,
          pm.edition_type
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${dataStartDate}'::timestamp
      )
      SELECT
        date,
        edition_type,
        COUNT(DISTINCT email) as unique_readers,
        SUM(open_count) as total_opens
      FROM filtered_data
      GROUP BY date, edition_type
      ORDER BY date
    `;

    const dailyResult = await pixelPool.query(dailyQuery);
    const dailyTime = Date.now() - startDaily;
    console.log(`   ✅ Concluído em ${(dailyTime / 1000).toFixed(2)}s`);
    console.log(`   Total de dias: ${dailyResult.rows.length}`);

    // Query otimizada por dia da semana
    console.log("\n3️⃣ Testando query por dia da semana...");
    const startWeekday = Date.now();

    const weekdayQuery = `
      WITH filtered_data AS (
        SELECT
          EXTRACT(DOW FROM pt.first_open_at) as day_of_week,
          pt.email,
          pt.open_count,
          pm.edition_type
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${dataStartDate}'::timestamp
      )
      SELECT
        day_of_week,
        edition_type,
        COUNT(DISTINCT email) as unique_readers,
        SUM(open_count) as total_opens
      FROM filtered_data
      GROUP BY day_of_week, edition_type
      ORDER BY day_of_week
    `;

    const weekdayResult = await pixelPool.query(weekdayQuery);
    const weekdayTime = Date.now() - startWeekday;
    console.log(`   ✅ Concluído em ${(weekdayTime / 1000).toFixed(2)}s`);
    console.log(`   Total de grupos: ${weekdayResult.rows.length}`);

    // Query de comparação
    console.log("\n4️⃣ Testando query de comparação...");
    const startComparison = Date.now();

    const comparisonQuery = `
      WITH filtered_posts AS (
        SELECT post_id, edition_type,
          CASE
            WHEN publish_date < '2025-10-01' THEN 'before'
            ELSE 'after'
          END as period
        FROM posts_metadata
        WHERE publish_date IS NOT NULL
          AND publish_date >= '${dataStartDate}'::timestamp
      )
      SELECT
        fp.edition_type,
        fp.period,
        COUNT(DISTINCT pt.email) as unique_readers,
        COUNT(DISTINCT DATE(pt.first_open_at)) as days_count
      FROM pixel_tracking_optimized pt
      INNER JOIN filtered_posts fp ON pt.post_id = fp.post_id
      GROUP BY fp.edition_type, fp.period
    `;

    const comparisonResult = await pixelPool.query(comparisonQuery);
    const comparisonTime = Date.now() - startComparison;
    console.log(`   ✅ Concluído em ${(comparisonTime / 1000).toFixed(2)}s`);
    console.log("   Resultado:", comparisonResult.rows);

    const totalTime = statsTime + dailyTime + weekdayTime + comparisonTime;

    console.log("\n\n📊 Resumo de Performance:");
    console.log(`   Stats Query: ${(statsTime / 1000).toFixed(2)}s`);
    console.log(`   Daily Query: ${(dailyTime / 1000).toFixed(2)}s`);
    console.log(`   Weekday Query: ${(weekdayTime / 1000).toFixed(2)}s`);
    console.log(`   Comparison Query: ${(comparisonTime / 1000).toFixed(2)}s`);
    console.log(`   ⏱️  Tempo Total: ${(totalTime / 1000).toFixed(2)}s`);

    if (totalTime < 60000) {
      console.log("\n✅ Performance OK! Todas as queries completaram em menos de 60s");
    } else {
      console.log("\n⚠️  Ainda muito lento. Tempo total acima de 60s");
    }

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro ao testar queries:", error);
    process.exit(1);
  }
}

testQueries();
