import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Configuração do banco Pixel
const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

// Aumentar timeout para 300 segundos (5 minutos - máximo Vercel Pro)
export const maxDuration = 300;

// Função para calcular segundos até próximo domingo às 23:50
function getSecondsUntilSundayNight(): number {
  const now = new Date();
  const nextSunday = new Date(now);

  // Calcular próximo domingo
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 50, 0, 0);

  // Se já passou das 23:50 de domingo, pegar próximo domingo
  if (nextSunday <= now) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }

  return Math.floor((nextSunday.getTime() - now.getTime()) / 1000);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    // Data de início dos dados (agosto 2025)
    const dataStartDate = '2025-08-01';
    // Data de lançamento da edição noite (julho 2025)
    const nightLaunchDate = '2025-07-01';

    // Query super otimizada usando cache pré-calculado
    const statsQuery = `
      SELECT
        edition_type,
        unique_readers,
        total_opens
      FROM pixel_stats_cache
      WHERE period_days = ${days}
    `;

    // Query otimizada usando tabela de agregação para comparação
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

    // Query otimizada usando tabela de agregação diária
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

    // Query otimizada usando tabela de agregação diária
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

    // Query para calcular sobreposição entre manhã e noite
    const overlapQuery = `
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
        ROUND((o.overlap_count::numeric / NULLIF((SELECT COUNT(*) FROM night_readers), 0)::numeric) * 100, 2) as overlap_pct_night
      FROM overlap o;
    `;

    const [statsResult, dailyResult, weekdayResult, comparisonResult, overlapResult] = await Promise.all([
      pixelPool.query(statsQuery),
      pixelPool.query(dailyQuery),
      pixelPool.query(weekdayQuery),
      pixelPool.query(comparisonQuery),
      pixelPool.query(overlapQuery),
    ]);

    // Processar estatísticas
    const stats = {
      morning: {
        total: 0,
        average: 0,
        uniqueReaders: 0,
        trend: 0,
      },
      night: {
        total: 0,
        average: 0,
        uniqueReaders: 0,
        trend: 0,
      },
      sunday: {
        total: 0,
        average: 0,
        uniqueReaders: 0,
        trend: 0,
      },
    };

    statsResult.rows.forEach((row) => {
      const type = row.edition_type as "morning" | "night" | "sunday";
      const uniqueReaders = parseInt(row.unique_readers);
      stats[type] = {
        total: uniqueReaders, // Usar unique_readers em vez de total_opens
        average: Math.round(uniqueReaders / days),
        uniqueReaders: uniqueReaders,
        trend: 0, // Será calculado comparando com período anterior
      };
    });

    // Processar dados diários (usando unique_readers)
    const dailyDataMap = new Map<string, { morning: number; night: number; sunday: number }>();
    dailyResult.rows.forEach((row) => {
      const dateStr = new Date(row.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      if (!dailyDataMap.has(dateStr)) {
        dailyDataMap.set(dateStr, { morning: 0, night: 0, sunday: 0 });
      }
      const data = dailyDataMap.get(dateStr)!;
      data[row.edition_type as "morning" | "night" | "sunday"] = parseInt(row.unique_readers); // Usar unique_readers
    });

    const dailyData = Array.from(dailyDataMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Processar dados por dia da semana
    const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weekdayDataMap = new Map<number, { day: string; morning: number; night: number; sunday: number }>();

    for (let i = 0; i <= 6; i++) {
      weekdayDataMap.set(i, { day: weekdayNames[i], morning: 0, night: 0, sunday: 0 });
    }

    weekdayResult.rows.forEach((row) => {
      const dayNum = parseInt(row.day_of_week);
      const data = weekdayDataMap.get(dayNum)!;
      data[row.edition_type as "morning" | "night" | "sunday"] = parseInt(row.unique_readers); // Usar unique_readers
    });

    const weekdayData = Array.from(weekdayDataMap.values()); // Manter todos os dias incluindo domingo

    // Processar dados de comparação antes/depois
    const comparisonData = {
      morning: {
        before: { avgUniqueReaders: 0, totalDays: 0 },
        after: { avgUniqueReaders: 0, totalDays: 0 },
        change: 0,
      },
      night: {
        before: { avgUniqueReaders: 0, totalDays: 0 },
        after: { avgUniqueReaders: 0, totalDays: 0 },
        change: 0,
      },
    };

    comparisonResult.rows.forEach((row) => {
      const edition = row.edition_type as 'morning' | 'night' | 'sunday';
      const period = row.period as 'before' | 'after';

      if (edition === 'morning' || edition === 'night') {
        const uniqueReaders = parseInt(row.unique_readers);
        const daysCount = parseInt(row.days_count);
        const avgUniqueReaders = daysCount > 0 ? Math.round(uniqueReaders / daysCount) : 0;

        comparisonData[edition][period] = {
          avgUniqueReaders,
          totalDays: daysCount,
        };
      }
    });

    // Calcular variação percentual
    if (comparisonData.morning.before.avgUniqueReaders > 0) {
      comparisonData.morning.change =
        ((comparisonData.morning.after.avgUniqueReaders - comparisonData.morning.before.avgUniqueReaders) /
        comparisonData.morning.before.avgUniqueReaders) * 100;
    }

    if (comparisonData.night.before.avgUniqueReaders > 0) {
      comparisonData.night.change =
        ((comparisonData.night.after.avgUniqueReaders - comparisonData.night.before.avgUniqueReaders) /
        comparisonData.night.before.avgUniqueReaders) * 100;
    }

    // Processar dados de sobreposição
    const overlapData = overlapResult.rows[0]
      ? {
          morningUnique: parseInt(overlapResult.rows[0].morning_unique),
          nightUnique: parseInt(overlapResult.rows[0].night_unique),
          overlapCount: parseInt(overlapResult.rows[0].overlap_count),
          overlapPctMorning: parseFloat(overlapResult.rows[0].overlap_pct_morning) || 0,
          overlapPctNight: parseFloat(overlapResult.rows[0].overlap_pct_night) || 0,
          morningOnlyCount: parseInt(overlapResult.rows[0].morning_unique) - parseInt(overlapResult.rows[0].overlap_count),
          nightOnlyCount: parseInt(overlapResult.rows[0].night_unique) - parseInt(overlapResult.rows[0].overlap_count),
        }
      : null;

    // Calcular cache até próximo domingo 23:50
    const maxAge = getSecondsUntilSundayNight();
    const staleWhileRevalidate = maxAge + 86400; // +24h após expirar

    return NextResponse.json(
      {
        stats,
        dailyData,
        weekdayData,
        comparisonData,
        overlapData,
        nightLaunchDate,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        },
      }
    );
  } catch (error) {
    console.error("Error fetching pixel stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch pixel statistics" },
      { status: 500 }
    );
  }
}
