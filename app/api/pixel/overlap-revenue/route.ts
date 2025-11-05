import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    console.log(`💰📊 Calculando métricas de overlap + receita (${days} dias)...`);

    // Query principal que calcula overlap + métricas de engagement e receita
    const overlapRevenueQuery = `
      WITH morning_readers AS (
        SELECT DISTINCT 
          pt.email,
          COUNT(*) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'morning'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
        GROUP BY pt.email
      ),
      night_readers AS (
        SELECT DISTINCT 
          pt.email,
          COUNT(*) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'night'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
        GROUP BY pt.email
      ),
      both_readers AS (
        SELECT 
          mr.email,
          mr.total_opens as morning_opens,
          nr.total_opens as night_opens,
          (mr.total_opens + nr.total_opens) as total_opens
        FROM morning_readers mr
        INNER JOIN night_readers nr ON mr.email = nr.email
      ),
      morning_only AS (
        SELECT 
          mr.email,
          mr.total_opens
        FROM morning_readers mr
        LEFT JOIN night_readers nr ON mr.email = nr.email
        WHERE nr.email IS NULL
      ),
      night_only AS (
        SELECT 
          nr.email,
          nr.total_opens
        FROM night_readers nr
        LEFT JOIN morning_readers mr ON nr.email = mr.email
        WHERE mr.email IS NULL
      ),
      total_revenue AS (
        SELECT 
          SUM(COALESCE(morning_revenue, 0)) as morning_revenue,
          SUM(COALESCE(night_revenue, 0)) as night_revenue,
          SUM(COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0)) as total_revenue
        FROM revenue_data
        WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
      )
      SELECT 
        -- Leem AMBAS
        (SELECT COUNT(*) FROM both_readers) as both_users,
        (SELECT SUM(total_opens) FROM both_readers) as both_total_opens,
        (SELECT AVG(total_opens) FROM both_readers) as both_avg_opens_per_user,
        
        -- Apenas Manhã
        (SELECT COUNT(*) FROM morning_only) as morning_only_users,
        (SELECT SUM(total_opens) FROM morning_only) as morning_only_total_opens,
        (SELECT AVG(total_opens) FROM morning_only) as morning_only_avg_opens_per_user,
        
        -- Apenas Noite
        (SELECT COUNT(*) FROM night_only) as night_only_users,
        (SELECT SUM(total_opens) FROM night_only) as night_only_total_opens,
        (SELECT AVG(total_opens) FROM night_only) as night_only_avg_opens_per_user,
        
        -- Totais
        (SELECT COUNT(*) FROM morning_readers) as total_morning_users,
        (SELECT COUNT(*) FROM night_readers) as total_night_users,
        (SELECT COUNT(*) FROM both_readers) + (SELECT COUNT(*) FROM morning_only) + (SELECT COUNT(*) FROM night_only) as total_unique_users,
        
        -- Receita
        tr.morning_revenue,
        tr.night_revenue,
        tr.total_revenue
        
      FROM total_revenue tr;
    `;

    const result = await pixelPool.query(overlapRevenueQuery);
    const data = result.rows[0];

    // Calcular distribuição proporcional de receita
    const totalOpens = 
      (parseInt(data.both_total_opens) || 0) + 
      (parseInt(data.morning_only_total_opens) || 0) + 
      (parseInt(data.night_only_total_opens) || 0);

    const totalRevenue = parseFloat(data.total_revenue) || 0;

    // Distribuir receita proporcionalmente às aberturas
    const bothRevenue = totalOpens > 0 
      ? (parseInt(data.both_total_opens) / totalOpens) * totalRevenue 
      : 0;
    
    const morningOnlyRevenue = totalOpens > 0 
      ? (parseInt(data.morning_only_total_opens) / totalOpens) * totalRevenue 
      : 0;
    
    const nightOnlyRevenue = totalOpens > 0 
      ? (parseInt(data.night_only_total_opens) / totalOpens) * totalRevenue 
      : 0;

    // Calcular métricas
    const bothUsers = parseInt(data.both_users) || 0;
    const morningOnlyUsers = parseInt(data.morning_only_users) || 0;
    const nightOnlyUsers = parseInt(data.night_only_users) || 0;
    
    const bothTotalOpens = parseInt(data.both_total_opens) || 0;
    const morningOnlyTotalOpens = parseInt(data.morning_only_total_opens) || 0;
    const nightOnlyTotalOpens = parseInt(data.night_only_total_opens) || 0;

    const response = {
      period: days,
      overlap: {
        both: {
          users: bothUsers,
          totalOpens: bothTotalOpens,
          avgOpensPerUser: parseFloat(data.both_avg_opens_per_user) || 0,
          revenue: bothRevenue,
          ltv: bothUsers > 0 ? bothRevenue / bothUsers : 0,
          revenuePerOpen: bothTotalOpens > 0 ? bothRevenue / bothTotalOpens : 0,
          percentageOfUsers: ((bothUsers / (bothUsers + morningOnlyUsers + nightOnlyUsers)) * 100) || 0,
        },
        morningOnly: {
          users: morningOnlyUsers,
          totalOpens: morningOnlyTotalOpens,
          avgOpensPerUser: parseFloat(data.morning_only_avg_opens_per_user) || 0,
          revenue: morningOnlyRevenue,
          ltv: morningOnlyUsers > 0 ? morningOnlyRevenue / morningOnlyUsers : 0,
          revenuePerOpen: morningOnlyTotalOpens > 0 ? morningOnlyRevenue / morningOnlyTotalOpens : 0,
          percentageOfUsers: ((morningOnlyUsers / (bothUsers + morningOnlyUsers + nightOnlyUsers)) * 100) || 0,
        },
        nightOnly: {
          users: nightOnlyUsers,
          totalOpens: nightOnlyTotalOpens,
          avgOpensPerUser: parseFloat(data.night_only_avg_opens_per_user) || 0,
          revenue: nightOnlyRevenue,
          ltv: nightOnlyUsers > 0 ? nightOnlyRevenue / nightOnlyUsers : 0,
          revenuePerOpen: nightOnlyTotalOpens > 0 ? nightOnlyRevenue / nightOnlyTotalOpens : 0,
          percentageOfUsers: ((nightOnlyUsers / (bothUsers + morningOnlyUsers + nightOnlyUsers)) * 100) || 0,
        },
      },
      totals: {
        totalUniqueUsers: parseInt(data.total_unique_users) || 0,
        totalOpens: totalOpens,
        totalRevenue: totalRevenue,
        avgRevenuePerUser: (bothUsers + morningOnlyUsers + nightOnlyUsers) > 0 
          ? totalRevenue / (bothUsers + morningOnlyUsers + nightOnlyUsers) 
          : 0,
        avgRevenuePerOpen: totalOpens > 0 ? totalRevenue / totalOpens : 0,
      },
    };

    console.log(`✅ Métricas calculadas com sucesso`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erro ao calcular overlap + receita:", error);
    return NextResponse.json(
      { error: "Failed to calculate overlap revenue metrics" },
      { status: 500 }
    );
  }
}

