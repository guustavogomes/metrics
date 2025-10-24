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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

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
      GROUP BY pm.edition_type
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
      GROUP BY EXTRACT(DOW FROM pt.first_open_at), pm.edition_type
      ORDER BY day_of_week
    `;

    const [statsResult, dailyResult, weekdayResult] = await Promise.all([
      pixelPool.query(statsQuery),
      pixelPool.query(dailyQuery),
      pixelPool.query(weekdayQuery),
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
    };

    statsResult.rows.forEach((row) => {
      const type = row.edition_type as "morning" | "night";
      stats[type] = {
        total: parseInt(row.total_opens),
        average: Math.round(parseInt(row.total_opens) / days),
        uniqueReaders: parseInt(row.unique_readers),
        trend: 0, // Será calculado comparando com período anterior
      };
    });

    // Processar dados diários
    const dailyDataMap = new Map<string, { morning: number; night: number }>();
    dailyResult.rows.forEach((row) => {
      const dateStr = new Date(row.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      if (!dailyDataMap.has(dateStr)) {
        dailyDataMap.set(dateStr, { morning: 0, night: 0 });
      }
      const data = dailyDataMap.get(dateStr)!;
      data[row.edition_type as "morning" | "night"] = parseInt(row.total_opens);
    });

    const dailyData = Array.from(dailyDataMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Processar dados por dia da semana
    const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weekdayDataMap = new Map<number, { day: string; morning: number; night: number }>();

    for (let i = 0; i <= 6; i++) {
      weekdayDataMap.set(i, { day: weekdayNames[i], morning: 0, night: 0 });
    }

    weekdayResult.rows.forEach((row) => {
      const dayNum = parseInt(row.day_of_week);
      const data = weekdayDataMap.get(dayNum)!;
      data[row.edition_type as "morning" | "night"] = parseInt(row.total_opens);
    });

    const weekdayData = Array.from(weekdayDataMap.values())
      .filter((d) => d.day !== "Dom"); // Remover domingo

    return NextResponse.json({
      stats,
      dailyData,
      weekdayData,
    });
  } catch (error) {
    console.error("Error fetching pixel stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch pixel statistics" },
      { status: 500 }
    );
  }
}
