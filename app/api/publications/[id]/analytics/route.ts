import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const publicationId = params.id;

    // Verificar se a publicação pertence ao usuário
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publicação não encontrada" },
        { status: 404 }
      );
    }

    if (publication.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calcular data de início
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar posts com estatísticas do período
    const posts = await prisma.post.findMany({
      where: {
        publicationId: publicationId,
        status: "confirmed",
        publishDate: {
          gte: startDate,
        },
      },
      include: {
        stats: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    // 1. Dados para gráfico de linha: Aberturas e Cliques ao longo do tempo
    const timeSeriesData = posts
      .filter((p) => p.stats && p.publishDate)
      .map((post) => ({
        date: post.publishDate!.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        fullDate: post.publishDate!.toISOString(),
        title: post.title.substring(0, 30),
        uniqueOpens: post.stats!.uniqueOpens,
        uniqueClicks: post.stats!.uniqueClicks,
        openRate: post.stats!.openRate,
        clickRate: post.stats!.clickRate,
      }))
      .reverse(); // Mais antigos primeiro

    // 2. Dados para gráfico de barras: Performance comparativa
    const performanceData = posts
      .filter((p) => p.stats)
      .slice(0, 10) // Top 10 mais recentes
      .map((post) => ({
        title: post.title.substring(0, 20) + "...",
        opens: post.stats!.uniqueOpens,
        clicks: post.stats!.uniqueClicks,
        sent: post.stats!.totalSent,
        openRate: post.stats!.openRate,
        clickRate: post.stats!.clickRate,
      }))
      .reverse();

    // 3. Dados para gráfico de área: Crescimento acumulado
    let cumulativeOpens = 0;
    let cumulativeClicks = 0;
    const cumulativeData = posts
      .filter((p) => p.stats && p.publishDate)
      .reverse()
      .map((post) => {
        cumulativeOpens += post.stats!.uniqueOpens;
        cumulativeClicks += post.stats!.uniqueClicks;
        return {
          date: post.publishDate!.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          cumulativeOpens,
          cumulativeClicks,
          dailyOpens: post.stats!.uniqueOpens,
          dailyClicks: post.stats!.uniqueClicks,
        };
      });

    // 4. Dados para gráfico de pizza: Distribuição de performance
    const totalPosts = posts.filter((p) => p.stats).length;
    const highPerformance = posts.filter(
      (p) => p.stats && p.stats.openRate >= 30
    ).length;
    const mediumPerformance = posts.filter(
      (p) => p.stats && p.stats.openRate >= 15 && p.stats.openRate < 30
    ).length;
    const lowPerformance = posts.filter(
      (p) => p.stats && p.stats.openRate < 15
    ).length;

    const distributionData = [
      {
        name: "Alta Performance",
        value: highPerformance,
        percentage: totalPosts
          ? ((highPerformance / totalPosts) * 100).toFixed(1)
          : "0",
        color: "#22c55e",
        criteria: "Taxa de abertura ≥ 30%",
      },
      {
        name: "Média Performance",
        value: mediumPerformance,
        percentage: totalPosts
          ? ((mediumPerformance / totalPosts) * 100).toFixed(1)
          : "0",
        color: "#f59e0b",
        criteria: "Taxa de abertura 15-30%",
      },
      {
        name: "Baixa Performance",
        value: lowPerformance,
        percentage: totalPosts
          ? ((lowPerformance / totalPosts) * 100).toFixed(1)
          : "0",
        color: "#ef4444",
        criteria: "Taxa de abertura < 15%",
      },
    ];

    // 5. Métricas agregadas
    const postsWithStats = posts.filter((p) => p.stats);
    const totalOpens = postsWithStats.reduce(
      (sum, p) => sum + p.stats!.uniqueOpens,
      0
    );
    const totalClicks = postsWithStats.reduce(
      (sum, p) => sum + p.stats!.uniqueClicks,
      0
    );
    const totalSent = postsWithStats.reduce(
      (sum, p) => sum + p.stats!.totalSent,
      0
    );
    const avgOpenRate =
      postsWithStats.length > 0
        ? postsWithStats.reduce((sum, p) => sum + p.stats!.openRate, 0) /
          postsWithStats.length
        : 0;
    const avgClickRate =
      postsWithStats.length > 0
        ? postsWithStats.reduce((sum, p) => sum + p.stats!.clickRate, 0) /
          postsWithStats.length
        : 0;

    const summary = {
      totalPosts: postsWithStats.length,
      totalOpens,
      totalClicks,
      totalSent,
      avgOpenRate: Math.round(avgOpenRate * 100) / 100,
      avgClickRate: Math.round(avgClickRate * 100) / 100,
      ctr: totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(2) : "0",
    };

    return NextResponse.json({
      success: true,
      period: `${days} dias`,
      summary,
      charts: {
        timeSeries: timeSeriesData,
        performance: performanceData,
        cumulative: cumulativeData,
        distribution: distributionData,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar analytics:", error);
    return NextResponse.json(
      { error: "Erro ao buscar analytics" },
      { status: 500 }
    );
  }
}

