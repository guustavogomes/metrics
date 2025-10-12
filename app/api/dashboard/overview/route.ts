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

    console.log(`\n🔍 DEBUG: ${publications.length} publicações encontradas para o usuário`);
    publications.forEach((pub, index) => {
      console.log(`   ${index + 1}. ${pub.name} - ${pub.posts.length} posts com stats`);
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

    console.log("\n📊 Calculando Total de Assinantes por Newsletter:");
    console.log("━".repeat(60));

    let newslettersWithData = 0;
    publications.forEach((publication, index) => {
      console.log(`\n[${index + 1}/${publications.length}] Processando: ${publication.name}`);
      console.log(`   Posts disponíveis na query: ${publication.posts.length}`);
      
      // Para cada publicação, pegar o post mais recente com stats
      const publicationPosts = publication.posts
        .filter((p) => p.stats && p.publishDate)
        .sort((a, b) => new Date(b.publishDate!).getTime() - new Date(a.publishDate!).getTime());
      
      console.log(`   Posts após filtro (stats + publishDate): ${publicationPosts.length}`);
      
      // Somar os assinantes da publicação (post mais recente)
      if (publicationPosts.length > 0 && publicationPosts[0].stats) {
        const subscribers = publicationPosts[0].stats.totalSent;
        const previousTotal = totalSubscribers;
        totalSubscribers += subscribers;
        newslettersWithData++;
        
        console.log(`   ✅ ADICIONANDO: ${subscribers.toLocaleString("pt-BR")} assinantes`);
        console.log(`   └─ Total antes: ${previousTotal.toLocaleString("pt-BR")}`);
        console.log(`   └─ Total depois: ${totalSubscribers.toLocaleString("pt-BR")}`);
        console.log(`   └─ Post: ${publicationPosts[0].title.substring(0, 50)}...`);
        console.log(`   └─ Data: ${new Date(publicationPosts[0].publishDate!).toLocaleDateString("pt-BR")}`);
      } else {
        console.log(`   ❌ SEM DADOS - Não será contabilizada`);
      }

      publication.posts.forEach((post) => {
        if (post.stats) {
          totalOpens += post.stats.uniqueOpens;
          totalClicks += post.stats.uniqueClicks;
          totalSent += post.stats.totalSent;
          totalPosts++;

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

