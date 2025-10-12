import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const publicationId = params.id;

    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publicação não encontrada" },
        { status: 404 }
      );
    }

    const beehiivApiKey = process.env.BEEHIIV_API_KEY;
    if (!beehiivApiKey) {
      return NextResponse.json(
        { error: "BEEHIIV_API_KEY não configurada" },
        { status: 500 }
      );
    }

    console.log(`🔄 Sincronizando métricas da publicação ${publication.name}...`);

    // 1. Buscar dados da publicação na API do Beehiiv
    const pubResponse = await fetch(
      `https://api.beehiiv.com/v2/publications/${publication.beehiivId}`,
      {
        headers: {
          Authorization: `Bearer ${beehiivApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!pubResponse.ok) {
      throw new Error(`Beehiiv API error: ${pubResponse.statusText}`);
    }

    const pubData = await pubResponse.json();
    const totalSubscribers = pubData.data?.active_subscription_count || 0;

    console.log(`📊 Total de inscritos: ${totalSubscribers.toLocaleString("pt-BR")}`);

    // 2. Calcular métricas dos últimos 30 dias baseado nos posts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPosts = await prisma.post.findMany({
      where: {
        publicationId: publicationId,
        status: "confirmed",
        publishDate: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        stats: true,
      },
    });

    console.log(`📝 Posts dos últimos 30 dias: ${recentPosts.length}`);

    // Calcular médias
    const postsWithStats = recentPosts.filter((p) => p.stats);
    let avgOpenRate = 0;
    let avgClickRate = 0;
    let totalNewSubs = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalUnsubscribes = 0;

    if (postsWithStats.length > 0) {
      postsWithStats.forEach((post) => {
        if (post.stats) {
          avgOpenRate += post.stats.openRate;
          avgClickRate += post.stats.clickRate;
          totalOpens += post.stats.uniqueOpens;
          totalClicks += post.stats.uniqueClicks;
          totalUnsubscribes += post.stats.unsubscribes;
        }
      });

      avgOpenRate = avgOpenRate / postsWithStats.length;
      avgClickRate = avgClickRate / postsWithStats.length;
    }

    console.log(`📊 Taxa média de abertura: ${avgOpenRate.toFixed(1)}%`);
    console.log(`📊 Taxa média de cliques: ${avgClickRate.toFixed(1)}%`);

    // 3. Criar/atualizar registro de métrica para hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingMetric = await prisma.metric.findUnique({
      where: {
        publicationId_date: {
          publicationId: publicationId,
          date: today,
        },
      },
    });

    const metricData = {
      date: today,
      subscribers: totalSubscribers,
      opens: totalOpens,
      clicks: totalClicks,
      unsubscribes: totalUnsubscribes,
      newSubs: totalNewSubs,
    };

    if (existingMetric) {
      await prisma.metric.update({
        where: { id: existingMetric.id },
        data: metricData,
      });
      console.log("✅ Métrica atualizada para hoje");
    } else {
      await prisma.metric.create({
        data: {
          ...metricData,
          publicationId: publicationId,
        },
      });
      console.log("✅ Métrica criada para hoje");
    }

    console.log(`🎉 Sincronização de métricas concluída!`);

    return NextResponse.json({
      success: true,
      message: "Métricas sincronizadas com sucesso",
      data: {
        totalSubscribers,
        avgOpenRate: parseFloat(avgOpenRate.toFixed(2)),
        avgClickRate: parseFloat(avgClickRate.toFixed(2)),
        totalOpens,
        totalClicks,
        postsAnalyzed: postsWithStats.length,
      },
    });
  } catch (error) {
    console.error("Erro ao sincronizar métricas:", error);
    return NextResponse.json(
      {
        error: "Erro ao sincronizar métricas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

