import { Pool } from "pg";

/**
 * Módulo reutilizável para atualizar caches de estatísticas do pixel
 * Pode ser chamado após sincronizações ou manualmente
 */

export interface UpdateCachesOptions {
  pool?: Pool;
  periods?: number[]; // Períodos em dias para atualizar (padrão: 7, 30, 60, 90)
  updateDaily?: boolean; // Se deve atualizar pixel_daily_stats (padrão: true)
  updateStats?: boolean; // Se deve atualizar pixel_stats_cache (padrão: true)
  daysToUpdate?: number; // Quantos dias atualizar no daily_stats (padrão: 90)
  verbose?: boolean; // Logs detalhados (padrão: false)
}

export interface UpdateCachesResult {
  success: boolean;
  duration: number; // em ms
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
}

export async function updatePixelCaches(
  options: UpdateCachesOptions = {}
): Promise<UpdateCachesResult> {
  const {
    pool,
    periods = [7, 30, 60, 90],
    updateDaily = true,
    updateStats = true,
    daysToUpdate = 90,
    verbose = false,
  } = options;

  const startTime = Date.now();
  const result: UpdateCachesResult = {
    success: true,
    duration: 0,
  };

  // Criar pool se não foi fornecido
  const shouldClosePool = !pool;
  const pixelPool = pool || new Pool({
    host: "24.144.88.69",
    port: 5432,
    database: "waffle_metrics",
    user: "waffle",
    password: "waffle_secure_password_2024",
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
        result.dailyStats = {
          updated: true,
          duration: dailyDuration,
        };
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
          result.statsCache.periods.push({
            days,
            updated: true,
            duration: statsDuration,
          });
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

    result.duration = Date.now() - startTime;
    if (verbose) {
      console.log(`\n✅ Atualização completa em ${(result.duration / 1000).toFixed(2)}s`);
    }
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    if (verbose) console.error("❌ Erro ao atualizar caches:", error);
    throw error;
  } finally {
    // Fechar pool apenas se foi criado aqui
    if (shouldClosePool) {
      await pixelPool.end();
    }
  }

  return result;
}
