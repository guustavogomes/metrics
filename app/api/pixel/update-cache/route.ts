import { NextRequest, NextResponse } from "next/server";
import { updatePixelCaches } from "@/lib/update-pixel-caches";

// Aumentar timeout para atualização completa
export const maxDuration = 300;

/**
 * Endpoint para atualizar caches de estatísticas do pixel
 *
 * Query params opcionais:
 * - periods: Períodos para atualizar (ex: "7,30,60,90")
 * - updateDaily: Se deve atualizar pixel_daily_stats (default: true)
 * - updateStats: Se deve atualizar pixel_stats_cache (default: true)
 * - daysToUpdate: Quantos dias atualizar no daily_stats (default: 90)
 *
 * Exemplos:
 * - GET /api/pixel/update-cache (atualiza tudo)
 * - GET /api/pixel/update-cache?periods=7,30 (atualiza apenas 7 e 30 dias)
 * - GET /api/pixel/update-cache?updateDaily=false (atualiza apenas stats cache)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query params
    const periodsParam = searchParams.get("periods");
    const updateDailyParam = searchParams.get("updateDaily");
    const updateStatsParam = searchParams.get("updateStats");
    const daysToUpdateParam = searchParams.get("daysToUpdate");

    const periods = periodsParam
      ? periodsParam.split(",").map(Number).filter(n => !isNaN(n))
      : [7, 30, 60, 90];

    const updateDaily = updateDailyParam !== "false";
    const updateStats = updateStatsParam !== "false";
    const daysToUpdate = daysToUpdateParam ? parseInt(daysToUpdateParam) : 90;

    console.log("🔄 Starting cache update via API...");
    console.log(`   Periods: ${periods.join(", ")} dias`);
    console.log(`   Update daily: ${updateDaily}`);
    console.log(`   Update stats: ${updateStats}`);

    const result = await updatePixelCaches({
      periods,
      updateDaily,
      updateStats,
      daysToUpdate,
      verbose: true,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Caches updated successfully",
        duration: result.duration,
        details: {
          dailyStats: result.dailyStats,
          statsCache: result.statsCache,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Some caches failed to update",
          duration: result.duration,
          details: {
            dailyStats: result.dailyStats,
            statsCache: result.statsCache,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating pixel caches:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update pixel caches",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
