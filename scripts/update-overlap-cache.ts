import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

const dataStartDate = '2025-08-01';

async function updateOverlapCache() {
  const periods = [7, 30, 60, 90];

  console.log("🔄 Atualizando cache de overlap...\n");

  for (const days of periods) {
    const startTime = Date.now();
    console.log(`📊 Calculando overlap para ${days} dias...`);

    const query = `
      WITH morning_readers AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'morning'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${dataStartDate}'::timestamp
      ),
      night_readers AS (
        SELECT DISTINCT pt.email
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'night'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${dataStartDate}'::timestamp
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
        ROUND((o.overlap_count::numeric / NULLIF((SELECT COUNT(*) FROM morning_readers), 0)::numeric) * 100, 2) as overlap_pct_morning,
        ROUND((o.overlap_count::numeric / NULLIF((SELECT COUNT(*) FROM night_readers), 0)::numeric) * 100, 2) as overlap_pct_night,
        (SELECT COUNT(*) FROM morning_readers) - o.overlap_count as morning_only_count,
        (SELECT COUNT(*) FROM night_readers) - o.overlap_count as night_only_count
      FROM overlap o;
    `;

    const result = await pixelPool.query(query);
    const row = result.rows[0];

    if (row) {
      // Inserir ou atualizar cache
      await pixelPool.query(
        `INSERT INTO pixel_overlap_cache (
          period_days, 
          morning_unique, 
          night_unique, 
          overlap_count,
          overlap_pct_morning,
          overlap_pct_night,
          morning_only_count,
          night_only_count,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (period_days) 
        DO UPDATE SET
          morning_unique = EXCLUDED.morning_unique,
          night_unique = EXCLUDED.night_unique,
          overlap_count = EXCLUDED.overlap_count,
          overlap_pct_morning = EXCLUDED.overlap_pct_morning,
          overlap_pct_night = EXCLUDED.overlap_pct_night,
          morning_only_count = EXCLUDED.morning_only_count,
          night_only_count = EXCLUDED.night_only_count,
          updated_at = NOW()`,
        [
          days,
          row.morning_unique,
          row.night_unique,
          row.overlap_count,
          row.overlap_pct_morning,
          row.overlap_pct_night,
          row.morning_only_count,
          row.night_only_count,
        ]
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`   ✅ ${days} dias: ${duration}s`);
      console.log(`      • Manhã: ${row.morning_unique.toLocaleString()}`);
      console.log(`      • Noite: ${row.night_unique.toLocaleString()}`);
      console.log(`      • Overlap: ${row.overlap_count.toLocaleString()}\n`);
    }
  }

  console.log("✅ Cache de overlap atualizado com sucesso!\n");
}

updateOverlapCache()
  .then(() => {
    pixelPool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro ao atualizar cache de overlap:", error);
    pixelPool.end();
    process.exit(1);
  });

