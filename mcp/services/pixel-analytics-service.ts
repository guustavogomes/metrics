import { Pool } from "pg";

// Configuração do banco Pixel
const pixelPool = new Pool({
  host: process.env.PIXEL_DB_HOST || "24.144.88.69",
  port: parseInt(process.env.PIXEL_DB_PORT || "5432"),
  database: process.env.PIXEL_DB_NAME || "waffle_metrics",
  user: process.env.PIXEL_DB_USER || "waffle",
  password: process.env.PIXEL_DB_PASSWORD || "waffle_secure_password_2024",
});

const DATA_START_DATE = "2025-08-01";

/**
 * Filtro UTM para segmentar dados por canal de entrada
 * Campos disponíveis: utm_source, utm_medium, utm_campaign, utm_channel
 */
export interface UtmFilter {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_channel?: string;
}

/**
 * Gera cláusula WHERE SQL para filtros UTM
 * @param filter - Filtro UTM opcional
 * @param tableAlias - Alias da tabela (ex: "pt" para pixel_tracking_optimized)
 * @returns String SQL para adicionar ao WHERE, ou vazio se sem filtro
 */
function buildUtmWhereClause(filter?: UtmFilter, tableAlias: string = "pt"): string {
  if (!filter) return "";

  const conditions: string[] = [];

  if (filter.utm_source) {
    conditions.push(`${tableAlias}.utm_source = '${filter.utm_source.replace(/'/g, "''")}'`);
  }
  if (filter.utm_medium) {
    conditions.push(`${tableAlias}.utm_medium = '${filter.utm_medium.replace(/'/g, "''")}'`);
  }
  if (filter.utm_campaign) {
    conditions.push(`${tableAlias}.utm_campaign = '${filter.utm_campaign.replace(/'/g, "''")}'`);
  }
  if (filter.utm_channel) {
    conditions.push(`${tableAlias}.utm_channel = '${filter.utm_channel.replace(/'/g, "''")}'`);
  }

  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
}

export interface PixelStats {
  morning: {
    total: number;
    average: number;
    uniqueReaders: number;
  };
  night: {
    total: number;
    average: number;
    uniqueReaders: number;
  };
  sunday: {
    total: number;
    average: number;
    uniqueReaders: number;
  };
}

export interface OverlapRevenueData {
  period: number;
  overlap: {
    both: {
      users: number;
      totalOpens: number;
      avgOpensPerUser: number;
      revenue: number;
      ltv: number;
      percentageOfUsers: number;
    };
    morningOnly: {
      users: number;
      totalOpens: number;
      avgOpensPerUser: number;
      revenue: number;
      ltv: number;
      percentageOfUsers: number;
    };
    nightOnly: {
      users: number;
      totalOpens: number;
      avgOpensPerUser: number;
      revenue: number;
      ltv: number;
      percentageOfUsers: number;
    };
  };
  totals: {
    totalUniqueUsers: number;
    totalOpens: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
    avgRevenuePerOpen: number;
  };
}

export interface RevenueStats {
  stats: {
    totalRevenue: number;
    morningRevenue: number;
    nightRevenue: number;
    avgMorningRPM: number;
    avgNightRPM: number;
    monetizationRate: number;
  };
  timeSeries: Array<{
    date: string;
    totalRevenue: number;
    morningRevenue: number;
    nightRevenue: number;
  }>;
}

export class PixelAnalyticsService {
  /**
   * Busca estatísticas gerais do Pixel
   * @param days - Número de dias para análise
   * @param utmFilter - Filtro UTM opcional para segmentar por canal de entrada
   */
  async getStats(days: number = 30, utmFilter?: UtmFilter): Promise<PixelStats> {
    // Se houver filtro UTM, consultar diretamente a tabela (não usa cache)
    if (utmFilter && Object.keys(utmFilter).length > 0) {
      const utmCondition = buildUtmWhereClause(utmFilter, "pt");
      const statsQuery = `
        SELECT
          pm.edition_type,
          COUNT(DISTINCT pt.email) as unique_readers,
          COUNT(*) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${DATA_START_DATE}'::timestamp
          ${utmCondition}
        GROUP BY pm.edition_type
      `;

      const result = await pixelPool.query(statsQuery);

      const stats: PixelStats = {
        morning: { total: 0, average: 0, uniqueReaders: 0 },
        night: { total: 0, average: 0, uniqueReaders: 0 },
        sunday: { total: 0, average: 0, uniqueReaders: 0 },
      };

      result.rows.forEach((row) => {
        const type = row.edition_type as "morning" | "night" | "sunday";
        const uniqueReaders = parseInt(row.unique_readers);
        stats[type] = {
          total: uniqueReaders,
          average: Math.round(uniqueReaders / days),
          uniqueReaders: uniqueReaders,
        };
      });

      return stats;
    }

    // Sem filtro UTM, usar cache
    const statsQuery = `
      SELECT
        edition_type,
        unique_readers,
        total_opens
      FROM pixel_stats_cache
      WHERE period_days = ${days}
    `;

    const result = await pixelPool.query(statsQuery);

    const stats: PixelStats = {
      morning: { total: 0, average: 0, uniqueReaders: 0 },
      night: { total: 0, average: 0, uniqueReaders: 0 },
      sunday: { total: 0, average: 0, uniqueReaders: 0 },
    };

    result.rows.forEach((row) => {
      const type = row.edition_type as "morning" | "night" | "sunday";
      const uniqueReaders = parseInt(row.unique_readers);
      stats[type] = {
        total: uniqueReaders,
        average: Math.round(uniqueReaders / days),
        uniqueReaders: uniqueReaders,
      };
    });

    return stats;
  }

  /**
   * Busca dados de overlap e receita
   * @param days - Número de dias para análise
   * @param utmFilter - Filtro UTM opcional para segmentar por canal de entrada
   */
  async getOverlapRevenue(days: number = 30, utmFilter?: UtmFilter): Promise<OverlapRevenueData> {
    const utmCondition = buildUtmWhereClause(utmFilter, "pt");

    const overlapRevenueQuery = `
      WITH morning_readers AS (
        SELECT DISTINCT
          pt.email,
          COUNT(*) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pm.edition_type = 'morning'
          AND pt.first_open_at >= NOW() - INTERVAL '${days} days'
          ${utmCondition}
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
          ${utmCondition}
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
        (SELECT COUNT(*) FROM both_readers) as both_users,
        (SELECT SUM(total_opens) FROM both_readers) as both_total_opens,
        (SELECT AVG(total_opens) FROM both_readers) as both_avg_opens_per_user,
        (SELECT COUNT(*) FROM morning_only) as morning_only_users,
        (SELECT SUM(total_opens) FROM morning_only) as morning_only_total_opens,
        (SELECT AVG(total_opens) FROM morning_only) as morning_only_avg_opens_per_user,
        (SELECT COUNT(*) FROM night_only) as night_only_users,
        (SELECT SUM(total_opens) FROM night_only) as night_only_total_opens,
        (SELECT AVG(total_opens) FROM night_only) as night_only_avg_opens_per_user,
        (SELECT COUNT(*) FROM morning_readers) as total_morning_users,
        (SELECT COUNT(*) FROM night_readers) as total_night_users,
        (SELECT COUNT(*) FROM both_readers) + (SELECT COUNT(*) FROM morning_only) + (SELECT COUNT(*) FROM night_only) as total_unique_users,
        tr.morning_revenue,
        tr.night_revenue,
        tr.total_revenue
      FROM total_revenue tr;
    `;

    const result = await pixelPool.query(overlapRevenueQuery);
    const data = result.rows[0];

    const totalOpens =
      (parseInt(data.both_total_opens) || 0) +
      (parseInt(data.morning_only_total_opens) || 0) +
      (parseInt(data.night_only_total_opens) || 0);

    const totalRevenue = parseFloat(data.total_revenue) || 0;

    const bothRevenue =
      totalOpens > 0
        ? (parseInt(data.both_total_opens) / totalOpens) * totalRevenue
        : 0;

    const morningOnlyRevenue =
      totalOpens > 0
        ? (parseInt(data.morning_only_total_opens) / totalOpens) * totalRevenue
        : 0;

    const nightOnlyRevenue =
      totalOpens > 0
        ? (parseInt(data.night_only_total_opens) / totalOpens) * totalRevenue
        : 0;

    const bothUsers = parseInt(data.both_users) || 0;
    const morningOnlyUsers = parseInt(data.morning_only_users) || 0;
    const nightOnlyUsers = parseInt(data.night_only_users) || 0;

    return {
      period: days,
      overlap: {
        both: {
          users: bothUsers,
          totalOpens: parseInt(data.both_total_opens) || 0,
          avgOpensPerUser: parseFloat(data.both_avg_opens_per_user) || 0,
          revenue: bothRevenue,
          ltv: bothUsers > 0 ? bothRevenue / bothUsers : 0,
          percentageOfUsers:
            ((bothUsers / (bothUsers + morningOnlyUsers + nightOnlyUsers)) *
              100) || 0,
        },
        morningOnly: {
          users: morningOnlyUsers,
          totalOpens: parseInt(data.morning_only_total_opens) || 0,
          avgOpensPerUser:
            parseFloat(data.morning_only_avg_opens_per_user) || 0,
          revenue: morningOnlyRevenue,
          ltv: morningOnlyUsers > 0 ? morningOnlyRevenue / morningOnlyUsers : 0,
          percentageOfUsers:
            ((morningOnlyUsers /
              (bothUsers + morningOnlyUsers + nightOnlyUsers)) *
              100) || 0,
        },
        nightOnly: {
          users: nightOnlyUsers,
          totalOpens: parseInt(data.night_only_total_opens) || 0,
          avgOpensPerUser: parseFloat(data.night_only_avg_opens_per_user) || 0,
          revenue: nightOnlyRevenue,
          ltv: nightOnlyUsers > 0 ? nightOnlyRevenue / nightOnlyUsers : 0,
          percentageOfUsers:
            ((nightOnlyUsers / (bothUsers + morningOnlyUsers + nightOnlyUsers)) *
              100) || 0,
        },
      },
      totals: {
        totalUniqueUsers: parseInt(data.total_unique_users) || 0,
        totalOpens: totalOpens,
        totalRevenue: totalRevenue,
        avgRevenuePerUser:
          bothUsers + morningOnlyUsers + nightOnlyUsers > 0
            ? totalRevenue / (bothUsers + morningOnlyUsers + nightOnlyUsers)
            : 0,
        avgRevenuePerOpen: totalOpens > 0 ? totalRevenue / totalOpens : 0,
      },
    };
  }

  /**
   * Busca estatísticas de receita
   */
  async getRevenueStats(days: number = 30): Promise<RevenueStats> {
    const statsQuery = `
      SELECT 
        SUM(COALESCE(morning_revenue, 0)) as total_morning_revenue,
        SUM(COALESCE(night_revenue, 0)) as total_night_revenue,
        SUM(COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0)) as total_revenue,
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
        ROUND(
          (COUNT(CASE WHEN morning_revenue > 0 OR night_revenue > 0 THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0)::numeric * 100), 2
        ) as monetization_rate
      FROM revenue_data
      WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND (morning_revenue IS NOT NULL OR night_revenue IS NOT NULL);
    `;

    const timeSeriesQuery = `
      SELECT 
        ad_date::text as date,
        COALESCE(morning_revenue, 0) as morning_revenue,
        COALESCE(night_revenue, 0) as night_revenue,
        COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0) as total_revenue
      FROM revenue_data
      WHERE ad_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND (morning_revenue > 0 OR night_revenue > 0)
      ORDER BY ad_date ASC;
    `;

    const [statsResult, timeSeriesResult] = await Promise.all([
      pixelPool.query(statsQuery),
      pixelPool.query(timeSeriesQuery),
    ]);

    const stats = statsResult.rows[0];

    return {
      stats: {
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        morningRevenue: parseFloat(stats.total_morning_revenue) || 0,
        nightRevenue: parseFloat(stats.total_night_revenue) || 0,
        avgMorningRPM: parseFloat(stats.avg_morning_rpm) || 0,
        avgNightRPM: parseFloat(stats.avg_night_rpm) || 0,
        monetizationRate: parseFloat(stats.monetization_rate) || 0,
      },
      timeSeries: timeSeriesResult.rows.map((row) => ({
        date: row.date,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        morningRevenue: parseFloat(row.morning_revenue) || 0,
        nightRevenue: parseFloat(row.night_revenue) || 0,
      })),
    };
  }

  /**
   * Busca dados de comparação antes/depois (Ago-Set vs Out+)
   */
  async getComparisonData(): Promise<{
    morning: {
      before: { avgUniqueReaders: number; totalDays: number };
      after: { avgUniqueReaders: number; totalDays: number };
      change: number;
    };
    night: {
      before: { avgUniqueReaders: number; totalDays: number };
      after: { avgUniqueReaders: number; totalDays: number };
      change: number;
    };
  }> {
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
      WHERE date >= '${DATA_START_DATE}'::date
      GROUP BY edition_type, period
    `;

    const result = await pixelPool.query(comparisonQuery);

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

    result.rows.forEach((row) => {
      const edition = row.edition_type as "morning" | "night";
      const period = row.period as "before" | "after";

      if (edition === "morning" || edition === "night") {
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
        ((comparisonData.morning.after.avgUniqueReaders -
          comparisonData.morning.before.avgUniqueReaders) /
          comparisonData.morning.before.avgUniqueReaders) *
        100;
    }

    if (comparisonData.night.before.avgUniqueReaders > 0) {
      comparisonData.night.change =
        ((comparisonData.night.after.avgUniqueReaders -
          comparisonData.night.before.avgUniqueReaders) /
          comparisonData.night.before.avgUniqueReaders) *
        100;
    }

    return comparisonData;
  }

  /**
   * Busca dados por dia da semana
   * @param days - Número de dias para análise
   * @param utmFilter - Filtro UTM opcional para segmentar por canal de entrada
   */
  async getWeekdayData(days: number = 30, utmFilter?: UtmFilter): Promise<
    Array<{ day: string; morning: number; night: number; sunday: number }>
  > {
    let weekdayQuery: string;

    // Se houver filtro UTM, consultar diretamente a tabela (não usa cache)
    if (utmFilter && Object.keys(utmFilter).length > 0) {
      const utmCondition = buildUtmWhereClause(utmFilter, "pt");
      weekdayQuery = `
        SELECT
          EXTRACT(DOW FROM pt.first_open_at)::int as day_of_week,
          pm.edition_type,
          COUNT(DISTINCT pt.email) as unique_readers,
          COUNT(*) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${DATA_START_DATE}'::timestamp
          ${utmCondition}
        GROUP BY EXTRACT(DOW FROM pt.first_open_at), pm.edition_type
        ORDER BY day_of_week
      `;
    } else {
      // Sem filtro UTM, usar cache
      weekdayQuery = `
        SELECT
          day_of_week,
          edition_type,
          SUM(unique_readers) as unique_readers,
          SUM(total_opens) as total_opens
        FROM pixel_daily_stats
        WHERE date >= NOW() - INTERVAL '${days} days'
          AND date >= '${DATA_START_DATE}'::date
        GROUP BY day_of_week, edition_type
        ORDER BY day_of_week
      `;
    }

    const result = await pixelPool.query(weekdayQuery);

    const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weekdayDataMap = new Map<
      number,
      { day: string; morning: number; night: number; sunday: number }
    >();

    for (let i = 0; i <= 6; i++) {
      weekdayDataMap.set(i, {
        day: weekdayNames[i],
        morning: 0,
        night: 0,
        sunday: 0,
      });
    }

    result.rows.forEach((row) => {
      const dayNum = parseInt(row.day_of_week);
      const data = weekdayDataMap.get(dayNum)!;
      data[row.edition_type as "morning" | "night" | "sunday"] = parseInt(
        row.unique_readers
      );
    });

    return Array.from(weekdayDataMap.values());
  }

  /**
   * Busca evolução diária resumida (últimos 7 dias)
   * @param days - Número de dias para análise
   * @param utmFilter - Filtro UTM opcional para segmentar por canal de entrada
   */
  async getDailyData(days: number = 7, utmFilter?: UtmFilter): Promise<
    Array<{ date: string; morning: number; night: number; sunday: number }>
  > {
    let dailyQuery: string;

    // Se houver filtro UTM, consultar diretamente a tabela (não usa cache)
    if (utmFilter && Object.keys(utmFilter).length > 0) {
      const utmCondition = buildUtmWhereClause(utmFilter, "pt");
      dailyQuery = `
        SELECT
          DATE(pt.first_open_at) as date,
          pm.edition_type,
          COUNT(DISTINCT pt.email) as unique_readers,
          COUNT(*) as total_opens
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${days} days'
          AND pt.first_open_at >= '${DATA_START_DATE}'::timestamp
          ${utmCondition}
        GROUP BY DATE(pt.first_open_at), pm.edition_type
        ORDER BY date
      `;
    } else {
      // Sem filtro UTM, usar cache
      dailyQuery = `
        SELECT
          date,
          edition_type,
          unique_readers,
          total_opens
        FROM pixel_daily_stats
        WHERE date >= NOW() - INTERVAL '${days} days'
          AND date >= '${DATA_START_DATE}'::date
        ORDER BY date
      `;
    }

    const result = await pixelPool.query(dailyQuery);

    const dailyDataMap = new Map<
      string,
      { morning: number; night: number; sunday: number }
    >();

    result.rows.forEach((row) => {
      const dateStr = new Date(row.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      if (!dailyDataMap.has(dateStr)) {
        dailyDataMap.set(dateStr, { morning: 0, night: 0, sunday: 0 });
      }
      const data = dailyDataMap.get(dateStr)!;
      data[row.edition_type as "morning" | "night" | "sunday"] = parseInt(
        row.unique_readers
      );
    });

    return Array.from(dailyDataMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  /**
   * Busca porcentagem de usuários que abriram N edições na semana (segunda a sábado)
   * Suporta:
   * - N (exatamente N edições)
   * - N+ (N ou mais edições)
   * - -N (menos de N edições)
   * @param editionsFilter - Filtro de edições (ex: "7", "4+", "-3")
   * @param weeks - Número de semanas para análise
   * @param utmFilter - Filtro UTM opcional para segmentar por canal de entrada
   */
  async getWeeklyEditionsRate(
    editionsFilter: string, // Ex: "7", "4+", "-3"
    weeks: number = 4,
    utmFilter?: UtmFilter
  ): Promise<{
    week: string;
    totalUsers: number;
    usersWithNEditions: number;
    percentage: number;
    filterDescription: string;
  }[]> {
    // Parsear o filtro
    let filterType: "exact" | "gte" | "lt" = "exact";
    let editionsNumber = 7;
    
    if (editionsFilter.includes("+")) {
      // Formato: "4+" = 4 ou mais
      filterType = "gte";
      editionsNumber = parseInt(editionsFilter.replace("+", ""));
    } else if (editionsFilter.startsWith("-")) {
      // Formato: "-3" = menos de 3
      filterType = "lt";
      editionsNumber = parseInt(editionsFilter.replace("-", ""));
    } else {
      // Formato: "7" = exatamente 7
      filterType = "exact";
      editionsNumber = parseInt(editionsFilter);
    }
    
    // Validar número de edições
    if (isNaN(editionsNumber) || editionsNumber < 1 || editionsNumber > 7) {
      throw new Error("Número de edições deve estar entre 1 e 7");
    }
    
    // Construir condição SQL baseada no tipo de filtro
    let condition = "";
    let filterDescription = "";
    
    if (filterType === "exact") {
      condition = `editions_count = ${editionsNumber}`;
      filterDescription = `exatamente ${editionsNumber} edições`;
    } else if (filterType === "gte") {
      condition = `editions_count >= ${editionsNumber}`;
      filterDescription = `${editionsNumber} ou mais edições`;
    } else if (filterType === "lt") {
      condition = `editions_count < ${editionsNumber}`;
      filterDescription = `menos de ${editionsNumber} edições`;
    }

    // Adicionar filtro UTM se fornecido
    const utmCondition = buildUtmWhereClause(utmFilter, "pt");

    // Query que agrupa por semana e conta edições por usuário
    const query = `
      WITH weekly_editions AS (
        SELECT
          DATE_TRUNC('week', pt.first_open_at) + INTERVAL '1 day' as week_start,
          pt.email,
          COUNT(DISTINCT pt.post_id) as editions_count
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${weeks * 7} days'
          AND pt.first_open_at >= '${DATA_START_DATE}'::timestamp
          AND EXTRACT(DOW FROM pt.first_open_at) BETWEEN 1 AND 6  -- Segunda (1) a Sábado (6)
          AND pm.edition_type != 'sunday'  -- Excluir edições de domingo
          ${utmCondition}
        GROUP BY DATE_TRUNC('week', pt.first_open_at) + INTERVAL '1 day', pt.email
      ),
      weekly_stats AS (
        SELECT
          week_start,
          COUNT(DISTINCT email) as total_users,
          COUNT(DISTINCT CASE WHEN ${condition} THEN email END) as users_with_filter
        FROM weekly_editions
        GROUP BY week_start
      )
      SELECT
        TO_CHAR(week_start, 'DD/MM/YYYY') as week,
        total_users,
        users_with_filter,
        CASE 
          WHEN total_users > 0 
          THEN ROUND((users_with_filter::numeric / total_users::numeric * 100), 2)
          ELSE 0 
        END as percentage
      FROM weekly_stats
      ORDER BY week_start DESC
      LIMIT ${weeks};
    `;

    const result = await pixelPool.query(query);

    return result.rows.map((row) => ({
      week: row.week,
      totalUsers: parseInt(row.total_users) || 0,
      usersWithNEditions: parseInt(row.users_with_filter) || 0,
      percentage: parseFloat(row.percentage) || 0,
      filterDescription: filterDescription,
    }));
  }

  /**
   * Busca distribuição completa de edições semanais (0/7 até 7/7)
   * Retorna a porcentagem de usuários para cada bucket de edições
   * Com comparativo entre semanas
   * @param weeks - Número de semanas para análise
   * @param utmFilter - Filtro UTM opcional para segmentar por canal de entrada
   */
  async getWeeklyEditionsDistribution(
    weeks: number = 2,
    utmFilter?: UtmFilter
  ): Promise<{
    currentWeek: {
      weekStart: string;
      totalUsers: number;
      distribution: Array<{
        bucket: string;
        count: number;
        percentage: number;
      }>;
    };
    previousWeek: {
      weekStart: string;
      totalUsers: number;
      distribution: Array<{
        bucket: string;
        count: number;
        percentage: number;
      }>;
    } | null;
  }> {
    // Adicionar filtro UTM se fornecido
    const utmCondition = buildUtmWhereClause(utmFilter, "pt");

    // Query que calcula a distribuição de edições por semana
    const query = `
      WITH weekly_editions AS (
        SELECT
          DATE_TRUNC('week', pt.first_open_at) + INTERVAL '1 day' as week_start,
          pt.email,
          COUNT(DISTINCT pt.post_id) as editions_count
        FROM pixel_tracking_optimized pt
        INNER JOIN posts_metadata pm ON pt.post_id = pm.post_id
        WHERE pt.first_open_at >= NOW() - INTERVAL '${weeks * 7 + 7} days'
          AND pt.first_open_at >= '${DATA_START_DATE}'::timestamp
          AND EXTRACT(DOW FROM pt.first_open_at) BETWEEN 1 AND 6
          AND pm.edition_type != 'sunday'
          ${utmCondition}
        GROUP BY DATE_TRUNC('week', pt.first_open_at) + INTERVAL '1 day', pt.email
      ),
      capped_editions AS (
        SELECT
          week_start,
          email,
          LEAST(editions_count, 7) as editions_count
        FROM weekly_editions
      ),
      distribution AS (
        SELECT
          week_start,
          editions_count,
          COUNT(*) as user_count
        FROM capped_editions
        GROUP BY week_start, editions_count
      ),
      week_totals AS (
        SELECT
          week_start,
          SUM(user_count) as total_users
        FROM distribution
        GROUP BY week_start
      )
      SELECT
        TO_CHAR(d.week_start, 'DD/MM/YYYY') as week,
        d.week_start,
        d.editions_count,
        d.user_count,
        wt.total_users,
        ROUND((d.user_count::numeric / wt.total_users::numeric * 100), 2) as percentage
      FROM distribution d
      JOIN week_totals wt ON d.week_start = wt.week_start
      ORDER BY d.week_start DESC, d.editions_count ASC;
    `;

    const result = await pixelPool.query(query);

    // Agrupar por semana
    const weeklyData = new Map<
      string,
      {
        weekStart: string;
        totalUsers: number;
        distribution: Map<number, { count: number; percentage: number }>;
      }
    >();

    result.rows.forEach((row) => {
      const weekKey = row.week;
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          weekStart: weekKey,
          totalUsers: parseInt(row.total_users),
          distribution: new Map(),
        });
      }
      weeklyData.get(weekKey)!.distribution.set(parseInt(row.editions_count), {
        count: parseInt(row.user_count),
        percentage: parseFloat(row.percentage),
      });
    });

    // Converter para array ordenado por data (mais recente primeiro)
    const weeksArray = Array.from(weeklyData.values());

    // Formatar distribuição com buckets de 1-7 (0/7 não é mensurável pelo Pixel)
    const formatDistribution = (
      distMap: Map<number, { count: number; percentage: number }>,
      totalUsers: number
    ) => {
      const buckets = [];
      for (let i = 1; i <= 7; i++) {
        const data = distMap.get(i);
        buckets.push({
          bucket: `${i}/7`,
          count: data?.count || 0,
          percentage: data?.percentage || 0,
        });
      }
      return buckets;
    };

    const currentWeek = weeksArray[0];
    const previousWeek = weeksArray[1] || null;

    return {
      currentWeek: currentWeek
        ? {
            weekStart: currentWeek.weekStart,
            totalUsers: currentWeek.totalUsers,
            distribution: formatDistribution(
              currentWeek.distribution,
              currentWeek.totalUsers
            ),
          }
        : {
            weekStart: "",
            totalUsers: 0,
            distribution: [],
          },
      previousWeek: previousWeek
        ? {
            weekStart: previousWeek.weekStart,
            totalUsers: previousWeek.totalUsers,
            distribution: formatDistribution(
              previousWeek.distribution,
              previousWeek.totalUsers
            ),
          }
        : null,
    };
  }

  /**
   * Lista os valores UTM disponíveis para filtragem
   * Retorna os top 15 valores mais usados de cada campo UTM
   */
  async getUtmValues(): Promise<{
    utm_medium: Array<{ value: string; count: number }>;
    utm_source: Array<{ value: string; count: number }>;
  }> {
    const [mediumResult, sourceResult] = await Promise.all([
      pixelPool.query(`
        SELECT utm_medium as value, COUNT(*) as count
        FROM pixel_tracking_optimized
        WHERE utm_medium IS NOT NULL
          AND utm_medium NOT LIKE '3D%'
          AND LENGTH(utm_medium) > 2
        GROUP BY utm_medium
        ORDER BY count DESC
        LIMIT 15
      `),
      pixelPool.query(`
        SELECT utm_source as value, COUNT(*) as count
        FROM pixel_tracking_optimized
        WHERE utm_source IS NOT NULL
          AND utm_source NOT LIKE '3D%'
          AND utm_source NOT LIKE '%[%'
          AND LENGTH(utm_source) > 2
        GROUP BY utm_source
        ORDER BY count DESC
        LIMIT 15
      `),
    ]);

    return {
      utm_medium: mediumResult.rows.map((row) => ({
        value: row.value,
        count: parseInt(row.count),
      })),
      utm_source: sourceResult.rows.map((row) => ({
        value: row.value,
        count: parseInt(row.count),
      })),
    };
  }

  /**
   * Fecha conexões do pool
   */
  async close(): Promise<void> {
    await pixelPool.end();
  }
}

