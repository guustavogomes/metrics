import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar todas as publicações do usuário
    const publications = await prisma.publication.findMany({
      where: { userId },
      include: {
        posts: {
          where: {
            status: "confirmed",
            stats: {
              isNot: null,
            },
          },
          include: {
            stats: true,
          },
        },
      },
    });

    // Calcular métricas agregadas
    let totalSubscribers = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    let totalPosts = 0;

    // Calcular métricas dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calcular métricas dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let postsLast30Days = 0;
    let postsLast7Days = 0;
    let subscribersLast7Days = 0;

    publications.forEach((publication) => {
      publication.posts.forEach((post) => {
        if (post.stats) {
          totalOpens += post.stats.uniqueOpens;
          totalClicks += post.stats.uniqueClicks;
          totalSent += post.stats.totalSent;
          totalPosts++;

          // Maior número de totalSent = base atual aproximada
          if (post.stats.totalSent > totalSubscribers) {
            totalSubscribers = post.stats.totalSent;
          }

          // Posts dos últimos 30 dias
          if (post.publishDate && post.publishDate >= thirtyDaysAgo) {
            postsLast30Days++;
          }

          // Posts dos últimos 7 dias
          if (post.publishDate && post.publishDate >= sevenDaysAgo) {
            postsLast7Days++;
          }
        }
      });
    });

    // Calcular taxas médias
    const avgOpenRate =
      totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0";
    const avgClickRate =
      totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0.0";

    // Estimativa de novos inscritos (diferença entre posts mais recentes e antigos)
    const allPostsSorted = publications
      .flatMap((p) => p.posts)
      .filter((p) => p.stats && p.publishDate)
      .sort(
        (a, b) =>
          new Date(a.publishDate!).getTime() -
          new Date(b.publishDate!).getTime()
      );

    let newSubscribersLast7Days = 0;
    if (allPostsSorted.length >= 2) {
      const postsLast7 = allPostsSorted.filter(
        (p) => p.publishDate && new Date(p.publishDate) >= sevenDaysAgo
      );
      if (postsLast7.length > 0) {
        const firstPost = postsLast7[0];
        const lastPost = postsLast7[postsLast7.length - 1];
        newSubscribersLast7Days = Math.max(
          0,
          (lastPost.stats?.totalSent || 0) - (firstPost.stats?.totalSent || 0)
        );
      }
    }

    const data = {
      totalSubscribers,
      openRate: parseFloat(avgOpenRate),
      newSubscribers: newSubscribersLast7Days,
      totalPublications: publications.length,
      totalPosts,
      postsLast30Days,
      postsLast7Days,
      clickRate: parseFloat(avgClickRate),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar overview do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}

