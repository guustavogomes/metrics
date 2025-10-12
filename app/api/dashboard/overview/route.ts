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

    // Query otimizada baseada na sugestão SQL
    const postsWithStats = await (prisma as any).post.findMany({
      where: {
        status: "confirmed",
        stats: {
          isNot: null,
        },
        publication: {
          userId: userId,
        },
      },
      include: {
        stats: true,
        publication: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    console.log(`📊 [Dashboard] Encontrados ${postsWithStats.length} posts sincronizados`);

    // Calcular métricas agregadas
    let totalSubscribers = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    let totalPostsAll = postsWithStats.length; // TODOS os posts sincronizados
    let totalPosts30Days = 0; // Posts dos últimos 30 dias (para cálculos)

    // Calcular métricas dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let postsLast7Days = 0;
    let newslettersWithData = 0;

    // Agrupar posts por publicação para calcular total de assinantes
    const postsByPublication = new Map();
    
    postsWithStats.forEach((post: any) => {
      const pubId = post.publication.id;
      if (!postsByPublication.has(pubId)) {
        postsByPublication.set(pubId, {
          name: post.publication.name,
          posts: [],
        });
      }
      postsByPublication.get(pubId).posts.push(post);
    });

    // Calcular total de assinantes (Math.max de cada publicação)
    postsByPublication.forEach((publication: any, pubId: string) => {
      const maxSubscribers = Math.max(
        ...publication.posts.map((p: any) => p.stats?.totalSent || 0)
      );
      
      totalSubscribers += maxSubscribers;
      newslettersWithData++;
      
      console.log(`   ✅ ${publication.name}: ${maxSubscribers.toLocaleString("pt-BR")} assinantes (${publication.posts.length} posts sincronizados)`);
    });

    // Agregar métricas de TODOS os posts
    postsWithStats.forEach((post: any) => {
      if (post.stats) {
        // Agregar métricas de TODOS os posts
        totalOpens += post.stats.uniqueOpens;
        totalClicks += post.stats.uniqueClicks;
        totalSent += post.stats.totalSent;

        // Contadores por período (para os cards específicos)
        if (post.publishDate && post.publishDate >= thirtyDaysAgo) {
          totalPosts30Days++;
        }

        if (post.publishDate && post.publishDate >= sevenDaysAgo) {
          postsLast7Days++;
        }
      }
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
    console.log(`   └─ Calculado de: ${totalPostsAll} posts sincronizados (TODOS)`);

    // Estimativa de novos inscritos (soma a diferença de cada newsletter)
    let newSubscribersLast7Days = 0;
    
    postsByPublication.forEach((publication) => {
      const postsWithPublishDate = publication.posts.filter((p: any) => p.stats && p.publishDate);
      
      if (postsWithPublishDate.length >= 2) {
        // Ordenar por data
        const sortedPosts = [...postsWithPublishDate].sort(
          (a: any, b: any) => new Date(a.publishDate!).getTime() - new Date(b.publishDate!).getTime()
        );
        
        // Pegar posts dos últimos 7 dias
        const postsLast7 = sortedPosts.filter(
          (p: any) => p.publishDate && new Date(p.publishDate) >= sevenDaysAgo
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

    console.log(`📰 PUBLICAÇÕES ATIVAS: ${newslettersWithData} newsletters`);
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

