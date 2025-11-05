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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    console.log(`📥 Exportando dados de sobreposição (${days} dias)...`);

    // Query para buscar os emails de cada grupo
    const exportQuery = `
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
      both_readers AS (
        SELECT mr.email
        FROM morning_readers mr
        INNER JOIN night_readers nr ON mr.email = nr.email
      ),
      morning_only AS (
        SELECT mr.email
        FROM morning_readers mr
        LEFT JOIN night_readers nr ON mr.email = nr.email
        WHERE nr.email IS NULL
      ),
      night_only AS (
        SELECT nr.email
        FROM night_readers nr
        LEFT JOIN morning_readers mr ON nr.email = mr.email
        WHERE mr.email IS NULL
      )
      -- União de todos os grupos com a categoria
      SELECT email, 'Apenas Manhã' as categoria FROM morning_only
      UNION ALL
      SELECT email, 'Leem AMBAS' as categoria FROM both_readers
      UNION ALL
      SELECT email, 'Apenas Noite' as categoria FROM night_only
      ORDER BY categoria, email;
    `;

    const startTime = Date.now();
    const result = await pixelPool.query(exportQuery);
    const queryTime = Date.now() - startTime;

    console.log(`✅ Query concluída em ${queryTime}ms - ${result.rows.length} leitores`);

    // Gerar CSV
    const csvHeader = "Email,Categoria\n";
    const csvRows = result.rows
      .map(row => `${row.email},"${row.categoria}"`)
      .join("\n");
    const csv = csvHeader + csvRows;

    // Retornar como arquivo CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="overlap-readers-${days}days-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao exportar dados:", error);
    return NextResponse.json(
      { error: "Failed to export overlap data" },
      { status: 500 }
    );
  }
}

