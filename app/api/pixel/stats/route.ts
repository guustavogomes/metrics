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

// Cache de 24 horas (86400 segundos)
export const revalidate = 86400;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    // Data de início dos dados (agosto 2025)
    const dataStartDate = '2025-08-01';
    // Data de lançamento da edição noite (julho 2025)
    const nightLaunchDate = '2025-07-01';

    // Query para estatísticas gerais
    const statsQuery = `
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

    // Query para comparação: primeiros 2 meses vs últimos 2 meses (desde agosto/2025)
    const comparisonQuery = `
      SELECT
        pm.edition_type,
        CASE
          WHEN pm.publish_date < '2025-10-01' THEN 'before'
          ELSE 'after'
        END as period,
        COUNT(DISTINCT pt.email) as unique_readers,
        COUNT(DISTINCT DATE(pt.first_open_at)) as days_count
      FROM pixel_tracking_optimized pt
      JOIN posts_metadata pm ON pt.post_id = pm.post_id
      WHERE pm.publish_date IS NOT NULL
        AND pm.publish_date >= '${dataStartDate}'
      GROUP BY pm.edition_type, period
    `;

    // Query para evolução diária
    const dailyQuery = `
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

    // Query para estatísticas por dia da semana
    const weekdayQuery = `
      SELECT
        EXTRACT(DOW FROM pt.first_open_at) as day_of_week,
        pm.edition_type,
        COUNT(DISTINCT pt.email) as unique_readers,
        SUM(pt.open_count) as total_opens
      FROM pixel_tracking_optimized pt
      JOIN posts_metadata pm ON pt.post_id = pm.post_id
      WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
        AND pt.first_open_at >= '${dataStartDate}'
      GROUP BY EXTRACT(DOW FROM pt.first_open_at), pm.edition_type
      ORDER BY day_of_week
    `;

    const [statsResult, dailyResult, weekdayResult, comparisonResult] = await Promise.all([
      pixelPool.query(statsQuery),
      pixelPool.query(dailyQuery),
      pixelPool.query(weekdayQuery),
      pixelPool.query(comparisonQuery),
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

    return NextResponse.json({
      stats,
      dailyData,
      weekdayData,
      comparisonData,
      nightLaunchDate,
    });
  } catch (error) {
    console.error("Error fetching pixel stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch pixel statistics" },
      { status: 500 }
    );
  }
}
