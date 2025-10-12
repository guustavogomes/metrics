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

    // Calcular data de início (últimos 30 dias para ter base atual)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar todas as publicações do usuário
    const publications = await prisma.publication.findMany({
      where: { userId },
      include: {
        posts: {
          where: {
            status: "confirmed",
            publishDate: {
              gte: thirtyDaysAgo, // Apenas posts dos últimos 30 dias
            },
            stats: {
              isNot: null,
            },
          },
          include: {
            stats: true,
          },
          orderBy: {
            publishDate: "desc",
          },
        },
      },
    });

    console.log(`📊 [Dashboard] Calculando overview de ${publications.length} publicações`);

    // Calcular métricas agregadas
    let totalSubscribers = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    let totalPosts = 0;

    // Calcular métricas dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let postsLast30Days = 0;
    let postsLast7Days = 0;
    let newslettersWithData = 0;

    publications.forEach((publication) => {
      // Filtrar posts com stats
      const postsWithStats = publication.posts.filter((p) => p.stats);
      
      // Usar Math.max() para pegar o maior totalSent (base atual da newsletter)
      if (postsWithStats.length > 0) {
        const maxSubscribers = Math.max(
          ...postsWithStats.map((p) => p.stats?.totalSent || 0)
        );
        
        totalSubscribers += maxSubscribers;
        newslettersWithData++;
        
        console.log(`   ✅ ${publication.name}: ${maxSubscribers.toLocaleString("pt-BR")} assinantes`);
      }

      publication.posts.forEach((post) => {
        if (post.stats) {
          totalOpens += post.stats.uniqueOpens;
          totalClicks += post.stats.uniqueClicks;
          totalSent += post.stats.totalSent;
          totalPosts++;

          // Todos os posts já são dos últimos 30 dias (filtrado na query)
          postsLast30Days++;

          // Posts dos últimos 7 dias
          if (post.publishDate && post.publishDate >= sevenDaysAgo) {
            postsLast7Days++;
          }
        }
      });
    });

    console.log(`\n✅ TOTAL DE ASSINANTES: ${totalSubscribers.toLocaleString("pt-BR")} (${newslettersWithData} newsletters)`);

    // Calcular taxas médias (agregadas de TODAS as newsletters)
    const avgOpenRate =
      totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0";
    const avgClickRate =
      totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0.0";
    
    console.log(`📧 TAXA DE ABERTURA: ${avgOpenRate}%`);
    console.log(`   └─ Total Aberturas: ${totalOpens.toLocaleString("pt-BR")}`);
    console.log(`   └─ Total Enviados: ${totalSent.toLocaleString("pt-BR")}`);
    console.log(`   └─ Calculado de: ${totalPosts} posts de TODAS as newsletters`);

    // Estimativa de novos inscritos (soma a diferença de cada newsletter)
    let newSubscribersLast7Days = 0;
    
    publications.forEach((publication) => {
      const postsWithStats = publication.posts.filter(p => p.stats && p.publishDate);
      
      if (postsWithStats.length >= 2) {
        // Ordenar por data
        const sortedPosts = [...postsWithStats].sort(
          (a, b) => new Date(a.publishDate!).getTime() - new Date(b.publishDate!).getTime()
        );
        
        // Pegar posts dos últimos 7 dias
        const postsLast7 = sortedPosts.filter(
          (p) => p.publishDate && new Date(p.publishDate) >= sevenDaysAgo
        );
        
        if (postsLast7.length >= 2) {
          const oldestPost = postsLast7[0];
          const newestPost = postsLast7[postsLast7.length - 1];
          
          const growth = Math.max(
            0,
            (newestPost.stats?.totalSent || 0) - (oldestPost.stats?.totalSent || 0)
          );
          
          newSubscribersLast7Days += growth;
        }
      }
    });

    console.log(`📰 PUBLICAÇÕES ATIVAS: ${newslettersWithData} de ${publications.length} sincronizadas`);
    console.log(`   └─ Posts sincronizados: ${totalPosts}`);
    console.log(`   └─ Posts últimos 30 dias: ${postsLast30Days}`);
    console.log(`   └─ Posts últimos 7 dias: ${postsLast7Days}\n`);

    const data = {
      totalSubscribers,
      openRate: parseFloat(avgOpenRate),
      newSubscribers: newSubscribersLast7Days,
      totalPublications: newslettersWithData, // ✅ Apenas newsletters COM dados
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

