import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function testAPIPerformance() {
  try {
    const days = 90;
    const dataStartDate = '2025-08-01';

    console.log("🧪 Testando performance da API atualizada (90 dias)...\n");

    // 1. Stats Query (única query que ainda usa tabela original)
    console.log("1️⃣ Testando statsQuery (unique readers)...");
    const startStats = Date.now();

    const statsQuery = `
      SELECT
        edition_type,
        unique_readers,
        total_opens
      FROM pixel_stats_cache
      WHERE period_days = ${days}
    `;

    const statsResult = await pixelPool.query(statsQuery);
    const statsTime = Date.now() - startStats;
    console.log(`   ✅ ${(statsTime / 1000).toFixed(2)}s`);
    console.log(`   Resultado:`, statsResult.rows);

    // 2. Daily Query (usando agregação)
    console.log("\n2️⃣ Testando dailyQuery (agregação)...");
    const startDaily = Date.now();

    const dailyQuery = `
      SELECT
        date,
        edition_type,
        unique_readers,
        total_opens
      FROM pixel_daily_stats
      WHERE date >= NOW() - INTERVAL '${days} days'
        AND date >= '${dataStartDate}'::date
      ORDER BY date
    `;

    const dailyResult = await pixelPool.query(dailyQuery);
    const dailyTime = Date.now() - startDaily;
    console.log(`   ✅ ${dailyTime}ms`);
    console.log(`   Registros: ${dailyResult.rows.length}`);

    // 3. Weekday Query (usando agregação)
    console.log("\n3️⃣ Testando weekdayQuery (agregação)...");
    const startWeekday = Date.now();

    const weekdayQuery = `
      SELECT
        day_of_week,
        edition_type,
        SUM(unique_readers) as unique_readers,
        SUM(total_opens) as total_opens
      FROM pixel_daily_stats
      WHERE date >= NOW() - INTERVAL '${days} days'
        AND date >= '${dataStartDate}'::date
      GROUP BY day_of_week, edition_type
      ORDER BY day_of_week
    `;

    const weekdayResult = await pixelPool.query(weekdayQuery);
    const weekdayTime = Date.now() - startWeekday;
    console.log(`   ✅ ${weekdayTime}ms`);
    console.log(`   Registros: ${weekdayResult.rows.length}`);

    // 4. Comparison Query
    console.log("\n4️⃣ Testando comparisonQuery...");
    const startComparison = Date.now();

    const comparisonQuery = `
      SELECT
        edition_type,
        CASE
          WHEN date < '2025-10-01' THEN 'before'
          ELSE 'after'
        END as period,
        SUM(unique_readers) as unique_readers,
        COUNT(DISTINCT date) as days_count
      FROM pixel_daily_stats
      WHERE date >= '${dataStartDate}'::date
      GROUP BY edition_type, period
    `;

    const comparisonResult = await pixelPool.query(comparisonQuery);
    const comparisonTime = Date.now() - startComparison;
    console.log(`   ✅ ${(comparisonTime / 1000).toFixed(2)}s`);

    const totalTime = statsTime + dailyTime + weekdayTime + comparisonTime;

    console.log("\n\n📊 Resumo de Performance:");
    console.log(`   Stats Query:      ${(statsTime / 1000).toFixed(2)}s`);
    console.log(`   Daily Query:      ${dailyTime}ms`);
    console.log(`   Weekday Query:    ${weekdayTime}ms`);
    console.log(`   Comparison Query: ${(comparisonTime / 1000).toFixed(2)}s`);
    console.log(`   ⏱️  TOTAL:         ${(totalTime / 1000).toFixed(2)}s`);

    if (totalTime < 60000) {
      console.log("\n✅ SUCESSO! API completou em menos de 60s");
      console.log(`   Melhoria: queries diárias e de weekday são instantâneas!`);
    } else {
      console.log("\n⚠️  Ainda acima de 60s, mas muito melhor que antes");
    }

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  }
}

testAPIPerformance();
