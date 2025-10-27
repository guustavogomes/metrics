import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function test7Days() {
  try {
    const days = 7;

    console.log("🧪 Testando queries com 7 dias...\n");

    // 1. Stats Query
    console.log("1️⃣ Testando Stats Query (7 dias)...");
    const statsStart = Date.now();

    const statsResult = await pixelPool.query(`
      SELECT
        edition_type,
        unique_readers,
        total_opens
      FROM pixel_stats_cache
      WHERE period_days = ${days}
    `);

    const statsTime = Date.now() - statsStart;
    console.log(`   ✅ ${statsTime}ms`);
    console.log("   Resultado:");
    statsResult.rows.forEach(row => {
      console.log(`     ${row.edition_type}: ${parseInt(row.unique_readers).toLocaleString()} readers`);
    });

    // 2. Daily Query
    console.log("\n2️⃣ Testando Daily Query (7 dias)...");
    const dailyStart = Date.now();

    const dailyResult = await pixelPool.query(`
      SELECT
        date,
        edition_type,
        unique_readers,
        total_opens
      FROM pixel_daily_stats
      WHERE date >= NOW() - INTERVAL '${days} days'
        AND date >= '2025-08-01'::date
      ORDER BY date
    `);

    const dailyTime = Date.now() - dailyStart;
    console.log(`   ✅ ${dailyTime}ms`);
    console.log(`   Registros: ${dailyResult.rows.length}`);

    // 3. Weekday Query
    console.log("\n3️⃣ Testando Weekday Query (7 dias)...");
    const weekdayStart = Date.now();

    const weekdayResult = await pixelPool.query(`
      SELECT
        day_of_week,
        edition_type,
        SUM(unique_readers) as unique_readers,
        SUM(total_opens) as total_opens
      FROM pixel_daily_stats
      WHERE date >= NOW() - INTERVAL '${days} days'
        AND date >= '2025-08-01'::date
      GROUP BY day_of_week, edition_type
      ORDER BY day_of_week
    `);

    const weekdayTime = Date.now() - weekdayStart;
    console.log(`   ✅ ${weekdayTime}ms`);
    console.log(`   Registros: ${weekdayResult.rows.length}`);

    // 4. Comparison Query
    console.log("\n4️⃣ Testando Comparison Query...");
    const comparisonStart = Date.now();

    const comparisonResult = await pixelPool.query(`
      SELECT
        edition_type,
        CASE
          WHEN date < '2025-10-01' THEN 'before'
          ELSE 'after'
        END as period,
        SUM(unique_readers) as unique_readers,
        COUNT(DISTINCT date) as days_count
      FROM pixel_daily_stats
      WHERE date >= '2025-08-01'::date
      GROUP BY edition_type, period
    `);

    const comparisonTime = Date.now() - comparisonStart;
    console.log(`   ✅ ${comparisonTime}ms`);

    const totalTime = statsTime + dailyTime + weekdayTime + comparisonTime;

    console.log("\n\n📊 Performance (7 dias):");
    console.log(`   Stats Query:      ${statsTime}ms`);
    console.log(`   Daily Query:      ${dailyTime}ms`);
    console.log(`   Weekday Query:    ${weekdayTime}ms`);
    console.log(`   Comparison Query: ${comparisonTime}ms`);
    console.log(`   ⏱️  TOTAL:         ${totalTime}ms`);

    console.log("\n✅ Todas as queries funcionando com 7 dias!");

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  }
}

test7Days();
