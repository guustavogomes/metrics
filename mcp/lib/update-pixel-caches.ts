import { Pool } from "pg";

/**
 * Módulo reutilizável para atualizar caches de estatísticas do pixel
 */

export interface UpdateCachesOptions {
  pool?: Pool;
  periods?: number[];
  updateDaily?: boolean;
  updateStats?: boolean;
  updateOverlap?: boolean;
  daysToUpdate?: number;
  verbose?: boolean;
}

export interface UpdateCachesResult {
  success: boolean;
  duration: number;
  dailyStats?: {
    updated: boolean;
    duration: number;
    error?: string;
  };
  statsCache?: {
    periods: {
      days: number;
      updated: boolean;
      duration: number;
      error?: string;
    }[];
  };
  overlapCache?: {
    periods: {
      days: number;
      updated: boolean;
      duration: number;
      error?: string;
    }[];
  };
}

export async function updatePixelCaches(
  options: UpdateCachesOptions = {}
): Promise<UpdateCachesResult> {
  const {
    pool,
    periods = [7, 30, 60, 90],
    updateDaily = true,
    updateStats = true,
    updateOverlap = true,
    daysToUpdate = 90,
    verbose = false,
  } = options;

  const startTime = Date.now();
  const result: UpdateCachesResult = {
    success: true,
    duration: 0,
  };

  const shouldClosePool = !pool;
  const pixelPool = pool || new Pool({
    host: process.env.PIXEL_DB_HOST || "24.144.88.69",
    port: parseInt(process.env.PIXEL_DB_PORT || "5432"),
    database: process.env.PIXEL_DB_NAME || "waffle_metrics",
    user: process.env.PIXEL_DB_USER || "waffle",
    password: process.env.PIXEL_DB_PASSWORD || "waffle_secure_password_2024",
  });

  try {
    // 1. Atualizar pixel_daily_stats
    if (updateDaily) {
      if (verbose) console.log(`📊 Atualizando pixel_daily_stats (últimos ${daysToUpdate} dias)...`);
      const dailyStart = Date.now();

      try {
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
          WHERE pt.first_open_at >= NOW() - INTERVAL '${daysToUpdate} days'
          GROUP BY DATE(pt.first_open_at), pm.edition_type
          ON CONFLICT (date, edition_type)
          DO UPDATE SET
            unique_readers = EXCLUDED.unique_readers,
            total_opens = EXCLUDED.total_opens,
            day_of_week = EXCLUDED.day_of_week,
            updated_at = NOW();
        `);

        const dailyDuration = Date.now() - dailyStart;
        result.dailyStats = { updated: true, duration: dailyDuration };
        if (verbose) console.log(`   ✅ Concluído em ${(dailyDuration / 1000).toFixed(2)}s`);
      } catch (error) {
        result.dailyStats = {
          updated: false,
          duration: Date.now() - dailyStart,
          error: error instanceof Error ? error.message : String(error),
        };
        if (verbose) console.error(`   ❌ Erro:`, error);
      }
    }

    // 2. Atualizar pixel_stats_cache para cada período
    if (updateStats) {
      result.statsCache = { periods: [] };

      for (const days of periods) {
        if (verbose) console.log(`\n📈 Atualizando pixel_stats_cache (${days} dias)...`);
        const statsStart = Date.now();

        try {
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

          const statsDuration = Date.now() - statsStart;
          result.statsCache.periods.push({ days, updated: true, duration: statsDuration });
          if (verbose) console.log(`   ✅ ${days} dias: ${(statsDuration / 1000).toFixed(2)}s`);
        } catch (error) {
          result.statsCache.periods.push({
            days,
            updated: false,
            duration: Date.now() - statsStart,
            error: error instanceof Error ? error.message : String(error),
          });
          if (verbose) console.error(`   ❌ Erro no período ${days} dias:`, error);
        }
      }
    }

    // 3. Atualizar pixel_overlap_cache para cada período
    if (updateOverlap) {
      result.overlapCache = { periods: [] };

      for (const days of periods) {
        if (verbose) console.log(`\n🔄 Atualizando pixel_overlap_cache (${days} dias)...`);
        const overlapStart = Date.now();

        try {
          const overlapQuery = `
            WITH morning_readers AS (
              SELECT DISTINCT pt.email
              FROM pixel_tracking_optimized pt
              INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
              WHERE pm.edition_type = 'morning'
                AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
                AND pt.first_open_at >= '2025-08-01'::timestamp
            ),
            night_readers AS (
              SELECT DISTINCT pt.email
              FROM pixel_tracking_optimized pt
              INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
              WHERE pm.edition_type = 'night'
                AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
                AND pt.first_open_at >= '2025-08-01'::timestamp
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

          const overlapResult = await pixelPool.query(overlapQuery);
          const row = overlapResult.rows[0];

          if (row) {
            await pixelPool.query(
              `INSERT INTO pixel_overlap_cache (
                period_days, morning_unique, night_unique, overlap_count,
                overlap_pct_morning, overlap_pct_night, morning_only_count, night_only_count, updated_at
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
              [days, row.morning_unique, row.night_unique, row.overlap_count,
               row.overlap_pct_morning, row.overlap_pct_night, row.morning_only_count, row.night_only_count]
            );
          }

          const overlapDuration = Date.now() - overlapStart;
          result.overlapCache.periods.push({ days, updated: true, duration: overlapDuration });
          if (verbose) console.log(`   ✅ ${days} dias: ${(overlapDuration / 1000).toFixed(2)}s`);
        } catch (error) {
          result.overlapCache.periods.push({
            days,
            updated: false,
            duration: Date.now() - overlapStart,
            error: error instanceof Error ? error.message : String(error),
          });
          if (verbose) console.error(`   ❌ Erro no período ${days} dias:`, error);
        }
      }
    }

    result.duration = Date.now() - startTime;
    if (verbose) console.log(`\n✅ Atualização completa em ${(result.duration / 1000).toFixed(2)}s`);
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    if (verbose) console.error("❌ Erro ao atualizar caches:", error);
    throw error;
  } finally {
    if (shouldClosePool) {
      await pixelPool.end();
    }
  }

  return result;
}
