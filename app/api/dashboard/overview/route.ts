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

    // Calcular datas para filtros
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar todas as publicações do usuário com TODOS os posts sincronizados
    const publications = await prisma.publication.findMany({
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
    let totalPostsAll = 0; // TODOS os posts sincronizados
    let totalPosts30Days = 0; // Posts dos últimos 30 dias (para cálculos)

    // Calcular métricas dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let postsLast7Days = 0;
    let newslettersWithData = 0;

    publications.forEach((publication) => {
      // TODOS os posts com stats (sem filtro de data)
      const allPostsWithStats = publication.posts.filter((p) => p.stats);
      
      // Posts dos últimos 30 dias (para cálculo de base atual)
      const postsLast30Days = allPostsWithStats.filter(
        (p) => p.publishDate && p.publishDate >= thirtyDaysAgo
      );
      
      // Usar Math.max() dos últimos 30 dias para pegar a base atual
      if (postsLast30Days.length > 0) {
        const maxSubscribers = Math.max(
          ...postsLast30Days.map((p) => p.stats?.totalSent || 0)
        );
        
        totalSubscribers += maxSubscribers;
        newslettersWithData++;
        
        console.log(`   ✅ ${publication.name}: ${maxSubscribers.toLocaleString("pt-BR")} assinantes (${allPostsWithStats.length} posts sincronizados)`);
      }

      // Iterar sobre TODOS os posts para contagens e agregações
      publication.posts.forEach((post) => {
        if (post.stats) {
          totalPostsAll++; // Contar TODOS

          // Agregar métricas apenas dos últimos 30 dias
          if (post.publishDate && post.publishDate >= thirtyDaysAgo) {
            totalOpens += post.stats.uniqueOpens;
            totalClicks += post.stats.uniqueClicks;
            totalSent += post.stats.totalSent;
            totalPosts30Days++;
          }

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
    console.log(`   └─ Calculado de: ${totalPosts30Days} posts dos últimos 30 dias`);

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
    console.log(`   └─ Posts sincronizados (TOTAL): ${totalPostsAll}`);
    console.log(`   └─ Posts últimos 30 dias: ${totalPosts30Days}`);
    console.log(`   └─ Posts últimos 7 dias: ${postsLast7Days}\n`);

    const data = {
      totalSubscribers,
      openRate: parseFloat(avgOpenRate),
      newSubscribers: newSubscribersLast7Days,
      totalPublications: newslettersWithData, // ✅ Apenas newsletters COM dados
      totalPosts: totalPostsAll, // ✅ TODOS os posts sincronizados
      postsLast30Days: totalPosts30Days,
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

