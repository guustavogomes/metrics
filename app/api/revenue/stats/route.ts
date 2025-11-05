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

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    console.log(`💰 Buscando dados de monetização (${days} dias)...`);

    // Query para estatísticas gerais de receita
    const statsQuery = `
      SELECT 
        -- Receita total
        SUM(COALESCE(morning_revenue, 0)) as total_morning_revenue,
        SUM(COALESCE(night_revenue, 0)) as total_night_revenue,
        SUM(COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0)) as total_revenue,
        
        -- RPM médio
        ROUND(AVG(
          CASE WHEN morning_unique_opens > 0 
          THEN (morning_revenue / morning_unique_opens * 1000)
          ELSE NULL END
        )::numeric, 2) as avg_morning_rpm,
        
        ROUND(AVG(
          CASE WHEN night_unique_opens > 0 
          THEN (night_revenue / night_unique_opens * 1000)
          ELSE NULL END
        )::numeric, 2) as avg_night_rpm,
        
        -- Contagem de anúncios
        COUNT(CASE WHEN morning_revenue > 0 THEN 1 END) as morning_ads_count,
        COUNT(CASE WHEN night_revenue > 0 THEN 1 END) as night_ads_count,
        
        -- Taxa de monetização (% de dias com anúncios)
        ROUND(
          (COUNT(CASE WHEN morning_revenue > 0 OR night_revenue > 0 THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0)::numeric * 100), 2
        ) as monetization_rate,
        
        -- Média de opens
        ROUND(AVG(NULLIF(morning_unique_opens, 0))::numeric, 0) as avg_morning_opens,
        ROUND(AVG(NULLIF(night_unique_opens, 0))::numeric, 0) as avg_night_opens
        
      FROM revenue_data
      WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND (morning_revenue IS NOT NULL OR night_revenue IS NOT NULL);
    `;

    // Query para série temporal (últimos N dias)
    const timeSeriesQuery = `
      SELECT 
        ad_date::text as date,
        COALESCE(morning_revenue, 0) as morning_revenue,
        COALESCE(night_revenue, 0) as night_revenue,
        COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0) as total_revenue,
        
        CASE 
          WHEN morning_unique_opens > 0 
          THEN ROUND((morning_revenue / morning_unique_opens * 1000)::numeric, 2)
          ELSE 0 
        END as morning_rpm,
        
        CASE 
          WHEN night_unique_opens > 0 
          THEN ROUND((night_revenue / night_unique_opens * 1000)::numeric, 2)
          ELSE 0 
        END as night_rpm,
        
        morning_unique_opens,
        night_unique_opens
        
      FROM revenue_data
      WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND (morning_revenue > 0 OR night_revenue > 0)
      ORDER BY ad_date ASC;
    `;

    // Query para top 10 dias com maior receita
    const topRevenueQuery = `
      SELECT 
        ad_date::text as date,
        COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0) as total_revenue,
        morning_revenue,
        night_revenue,
        morning_unique_opens,
        night_unique_opens
      FROM revenue_data
      WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND (morning_revenue > 0 OR night_revenue > 0)
      ORDER BY total_revenue DESC
      LIMIT 10;
    `;

    // Query para top 10 dias com maior RPM
    const topRPMQuery = `
      SELECT 
        ad_date::text as date,
        
        CASE 
          WHEN morning_unique_opens > 0 
          THEN ROUND((morning_revenue / morning_unique_opens * 1000)::numeric, 2)
          ELSE 0 
        END as morning_rpm,
        
        CASE 
          WHEN night_unique_opens > 0 
          THEN ROUND((night_revenue / night_unique_opens * 1000)::numeric, 2)
          ELSE 0 
        END as night_rpm,
        
        morning_revenue,
        night_revenue,
        morning_unique_opens,
        night_unique_opens
        
      FROM revenue_data
      WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND (morning_revenue > 0 OR night_revenue > 0)
      ORDER BY 
        GREATEST(
          COALESCE(morning_revenue / NULLIF(morning_unique_opens, 0) * 1000, 0),
          COALESCE(night_revenue / NULLIF(night_unique_opens, 0) * 1000, 0)
        ) DESC
      LIMIT 10;
    `;

    // Executar todas as queries em paralelo
    const [statsResult, timeSeriesResult, topRevenueResult, topRPMResult] = await Promise.all([
      pixelPool.query(statsQuery),
      pixelPool.query(timeSeriesQuery),
      pixelPool.query(topRevenueQuery),
      pixelPool.query(topRPMQuery),
    ]);

    const stats = statsResult.rows[0];

    const response = {
      stats: {
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        morningRevenue: parseFloat(stats.total_morning_revenue) || 0,
        nightRevenue: parseFloat(stats.total_night_revenue) || 0,
        avgMorningRPM: parseFloat(stats.avg_morning_rpm) || 0,
        avgNightRPM: parseFloat(stats.avg_night_rpm) || 0,
        morningAdsCount: parseInt(stats.morning_ads_count) || 0,
        nightAdsCount: parseInt(stats.night_ads_count) || 0,
        monetizationRate: parseFloat(stats.monetization_rate) || 0,
        avgMorningOpens: parseInt(stats.avg_morning_opens) || 0,
        avgNightOpens: parseInt(stats.avg_night_opens) || 0,
      },
      timeSeries: timeSeriesResult.rows.map(row => ({
        date: row.date,
        morningRevenue: parseFloat(row.morning_revenue) || 0,
        nightRevenue: parseFloat(row.night_revenue) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        morningRPM: parseFloat(row.morning_rpm) || 0,
        nightRPM: parseFloat(row.night_rpm) || 0,
        morningOpens: parseInt(row.morning_unique_opens) || 0,
        nightOpens: parseInt(row.night_unique_opens) || 0,
      })),
      topRevenue: topRevenueResult.rows.map(row => ({
        date: row.date,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        morningRevenue: parseFloat(row.morning_revenue) || 0,
        nightRevenue: parseFloat(row.night_revenue) || 0,
        morningOpens: parseInt(row.morning_unique_opens) || 0,
        nightOpens: parseInt(row.night_unique_opens) || 0,
      })),
      topRPM: topRPMResult.rows.map(row => ({
        date: row.date,
        morningRPM: parseFloat(row.morning_rpm) || 0,
        nightRPM: parseFloat(row.night_rpm) || 0,
        morningRevenue: parseFloat(row.morning_revenue) || 0,
        nightRevenue: parseFloat(row.night_revenue) || 0,
        morningOpens: parseInt(row.morning_unique_opens) || 0,
        nightOpens: parseInt(row.night_unique_opens) || 0,
      })),
    };

    console.log(`✅ Dados de monetização retornados com sucesso`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erro ao buscar dados de monetização:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}

