import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

async function testOverlap() {
  try {
    console.log("🔍 Analisando sobreposição de usuários entre edições manhã e noite...\n");

    const days = 30;

    // Query para calcular sobreposição
    const overlapQuery = `
      WITH morning_readers AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'morning'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
      ),
      night_readers AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'night'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
      ),
      overlap AS (
        SELECT COUNT(*) as overlap_count
        FROM morning_readers mr
        INNER JOIN night_readers nr ON mr.email = nr.email
      )
      SELECT
        (SELECT COUNT(*) FROM morning_readers) as morning_unique,
        (SELECT COUNT(*) FROM night_readers) as night_unique,
        o.overlap_count,
        ROUND((o.overlap_count::numeric / (SELECT COUNT(*) FROM morning_readers)::numeric) * 100, 2) as overlap_pct_morning,
        ROUND((o.overlap_count::numeric / (SELECT COUNT(*) FROM night_readers)::numeric) * 100, 2) as overlap_pct_night
      FROM overlap o;
    `;

    const startTime = Date.now();
    const result = await pixelPool.query(overlapQuery);
    const queryTime = Date.now() - startTime;

    const data = result.rows[0];

    console.log("📊 Resultados (últimos", days, "dias):\n");
    console.log(`  🌅 Leitores únicos da MANHÃ: ${parseInt(data.morning_unique).toLocaleString()}`);
    console.log(`  🌙 Leitores únicos da NOITE: ${parseInt(data.night_unique).toLocaleString()}`);
    console.log(`  🔄 Leitores que leem AMBAS: ${parseInt(data.overlap_count).toLocaleString()}`);
    console.log(`\n  📈 Porcentagem de sobreposição:`);
    console.log(`     ${data.overlap_pct_morning}% dos leitores da manhã também leem a noite`);
    console.log(`     ${data.overlap_pct_night}% dos leitores da noite também leem a manhã`);
    console.log(`\n  ⏱️  Query executada em ${queryTime}ms`);

    // Query adicional: sobreposição por período
    console.log("\n\n🔍 Análise por período:\n");

    const periodOverlapQuery = `
      WITH morning_readers_before AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'morning'
          AND pt.first_open_at >= '2025-08-01'::timestamp
          AND pt.first_open_at < '2025-10-01'::timestamp
      ),
      night_readers_before AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'night'
          AND pt.first_open_at >= '2025-08-01'::timestamp
          AND pt.first_open_at < '2025-10-01'::timestamp
      ),
      overlap_before AS (
        SELECT COUNT(*) as overlap_count
        FROM morning_readers_before mr
        INNER JOIN night_readers_before nr ON mr.email = nr.email
      ),
      morning_readers_after AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'morning'
          AND pt.first_open_at >= '2025-10-01'::timestamp
      ),
      night_readers_after AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'night'
          AND pt.first_open_at >= '2025-10-01'::timestamp
      ),
      overlap_after AS (
        SELECT COUNT(*) as overlap_count
        FROM morning_readers_after mr
        INNER JOIN night_readers_after nr ON mr.email = nr.email
      )
      SELECT
        'Ago-Set/2025' as period,
        (SELECT COUNT(*) FROM morning_readers_before) as morning_unique,
        (SELECT COUNT(*) FROM night_readers_before) as night_unique,
        ob.overlap_count,
        ROUND((ob.overlap_count::numeric / NULLIF((SELECT COUNT(*) FROM morning_readers_before), 0)::numeric) * 100, 2) as overlap_pct_morning
      FROM overlap_before ob
      UNION ALL
      SELECT
        'Out/2025+' as period,
        (SELECT COUNT(*) FROM morning_readers_after) as morning_unique,
        (SELECT COUNT(*) FROM night_readers_after) as night_unique,
        oa.overlap_count,
        ROUND((oa.overlap_count::numeric / NULLIF((SELECT COUNT(*) FROM morning_readers_after), 0)::numeric) * 100, 2) as overlap_pct_morning
      FROM overlap_after oa;
    `;

    const periodResult = await pixelPool.query(periodOverlapQuery);

    periodResult.rows.forEach((row) => {
      console.log(`  📅 ${row.period}:`);
      console.log(`     Manhã: ${parseInt(row.morning_unique).toLocaleString()} | Noite: ${parseInt(row.night_unique).toLocaleString()}`);
      console.log(`     Sobreposição: ${parseInt(row.overlap_count).toLocaleString()} (${row.overlap_pct_morning}% da manhã)`);
      console.log();
    });

    console.log("✅ Análise concluída!");

    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro:", error);
    await pixelPool.end();
    process.exit(1);
  }
}

testOverlap();
