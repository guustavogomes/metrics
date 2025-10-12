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

    console.log(`\n🔍 DEBUG: ${publications.length} publicações encontradas para o usuário`);
    publications.forEach((pub, index) => {
      console.log(`   ${index + 1}. ${pub.name} - ${pub.posts.length} posts com stats (últimos 30 dias)`);
    });

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

    console.log("\n📊 Calculando Total de Assinantes por Newsletter (MESMA LÓGICA DAS PÁGINAS INDIVIDUAIS):");
    console.log("━".repeat(60));

    let newslettersWithData = 0;
    publications.forEach((publication, index) => {
      console.log(`\n[${index + 1}/${publications.length}] Processando: ${publication.name}`);
      console.log(`   Posts disponíveis (últimos 30 dias): ${publication.posts.length}`);
      
      // Filtrar posts com stats
      const postsWithStats = publication.posts.filter((p) => p.stats);
      
      console.log(`   Posts com estatísticas: ${postsWithStats.length}`);
      
      // ✅ USAR A MESMA LÓGICA DAS PÁGINAS INDIVIDUAIS: Math.max()
      // Pegar o MAIOR totalSent dos posts (representa a base atual)
      if (postsWithStats.length > 0) {
        const maxSubscribers = Math.max(
          ...postsWithStats.map((p) => p.stats?.totalSent || 0)
        );
        
        const previousTotal = totalSubscribers;
        totalSubscribers += maxSubscribers;
        newslettersWithData++;
        
        // Encontrar qual post tem o maior número para mostrar no log
        const maxPost = postsWithStats.find(p => p.stats?.totalSent === maxSubscribers);
        
        console.log(`   ✅ ADICIONANDO (Math.max): ${maxSubscribers.toLocaleString("pt-BR")} assinantes`);
        console.log(`   └─ Total antes: ${previousTotal.toLocaleString("pt-BR")}`);
        console.log(`   └─ Total depois: ${totalSubscribers.toLocaleString("pt-BR")}`);
        if (maxPost) {
          console.log(`   └─ Post com maior base: ${maxPost.title.substring(0, 50)}...`);
          console.log(`   └─ Data: ${maxPost.publishDate ? new Date(maxPost.publishDate).toLocaleDateString("pt-BR") : "N/A"}`);
        }
      } else {
        console.log(`   ❌ SEM DADOS - Não será contabilizada`);
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

    console.log("\n" + "━".repeat(60));
    console.log(`✅ TOTAL GERAL: ${totalSubscribers.toLocaleString("pt-BR")} assinantes`);
    console.log(`   📊 ${newslettersWithData} newsletters COM dados (de ${publications.length} sincronizadas)`);
    console.log(`   🎯 Total esperado pelo usuário: 2.200.412`);
    console.log(`   ${totalSubscribers === 2200412 ? '✅ CORRETO!' : '⚠️ DIFERENÇA: ' + (totalSubscribers - 2200412).toLocaleString("pt-BR")}`);
    console.log("━".repeat(60) + "\n");

    // Calcular taxas médias
    const avgOpenRate =
      totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0";
    const avgClickRate =
      totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0.0";

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

