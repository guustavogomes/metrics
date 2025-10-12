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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicationId = params.id;

    // Verificar se a publicação pertence ao usuário
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    if (publication.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    // Calcular data de início
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar posts dos últimos X dias com suas estatísticas
    const recentPosts = await prisma.post.findMany({
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

    console.log(`📊 [Metrics] Encontrados ${recentPosts.length} posts dos últimos ${days} dias`);

    // Filtrar apenas posts com estatísticas
    const postsWithStats = recentPosts.filter((p) => p.stats);

    console.log(`📊 [Metrics] ${postsWithStats.length} posts têm estatísticas`);

    // Calcular métricas agregadas
    let totalSubscribers = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalUnsubscribes = 0;
    let totalSent = 0;
    let sumOpenRate = 0;
    let sumClickRate = 0;

    postsWithStats.forEach((post) => {
      if (post.stats) {
        totalOpens += post.stats.uniqueOpens;
        totalClicks += post.stats.uniqueClicks;
        totalUnsubscribes += post.stats.unsubscribes;
        totalSent += post.stats.totalSent;
        sumOpenRate += post.stats.openRate;
        sumClickRate += post.stats.clickRate;
      }
    });

    // Calcular médias
    const avgOpenRate = postsWithStats.length > 0 
      ? sumOpenRate / postsWithStats.length 
      : 0;
    
    const avgClickRate = postsWithStats.length > 0 
      ? sumClickRate / postsWithStats.length 
      : 0;

    // Buscar total de inscritos atual (usar o maior totalSent dos posts recentes)
    if (postsWithStats.length > 0) {
      totalSubscribers = Math.max(
        ...postsWithStats.map((p) => p.stats?.totalSent || 0)
      );
    }

    // Calcular novos inscritos (aproximação: diferença entre o post mais antigo e mais recente)
    let totalNewSubs = 0;
    if (postsWithStats.length >= 2) {
      const oldestPost = postsWithStats[postsWithStats.length - 1];
      const newestPost = postsWithStats[0];
      if (oldestPost.stats && newestPost.stats) {
        totalNewSubs = Math.max(0, newestPost.stats.totalSent - oldestPost.stats.totalSent);
      }
    }

    console.log(`📊 [Metrics] Calculado:`, {
      totalSubscribers,
      avgOpenRate: avgOpenRate.toFixed(2),
      avgClickRate: avgClickRate.toFixed(2),
      totalOpens,
      totalClicks,
      totalNewSubs,
    });

    const data = {
      publication: {
        id: publication.id,
        name: publication.name,
      },
      summary: {
        totalSubscribers,
        totalOpens,
        totalClicks,
        totalUnsubscribes,
        totalNewSubs,
        openRate: Math.round(avgOpenRate * 100) / 100,
        clickRate: Math.round(avgClickRate * 100) / 100,
        unsubscribeRate: totalSubscribers > 0 
          ? Math.round((totalUnsubscribes / totalSubscribers) * 10000) / 100
          : 0,
      },
      metrics: [], // Pode ser implementado depois se precisar de histórico
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
