import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ClickData {
  url: string;
  total_clicks: number;
  total_unique_clicks: number;
  total_click_through_rate: number;
  email: {
    clicks: number;
    unique_clicks: number;
    click_through_rate: number;
  };
  web: {
    clicks: number;
    unique_clicks: number;
    click_through_rate: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    const publicationId = params.id;

    // Buscar a publicação específica com posts e estatísticas
    const publication = await prisma.publication.findFirst({
      where: {
        id: publicationId,
        userId: userId,
      },
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

    if (!publication) {
      return NextResponse.json(
        { error: "Publicação não encontrada" },
        { status: 404 }
      );
    }

    console.log(`🔗 [URL Analytics] Analisando cliques da publicação: ${publication.name}`);

    // Agregar dados de cliques de todas as URLs desta publicação
    const urlClickMap = new Map<string, {
      url: string;
      totalClicks: number;
      totalUniqueClicks: number;
      totalEmailClicks: number;
      totalWebClicks: number;
      totalEmailUniqueClicks: number;
      totalWebUniqueClicks: number;
      avgClickThroughRate: number;
      posts: number;
      lastSeen: Date;
      domain: string;
      postTitles: string[];
    }>();

    let totalPostsAnalyzed = 0;

    publication.posts.forEach((post) => {
      if (post.stats?.clicks) {
        totalPostsAnalyzed++;
        
        try {
          const clicksData: ClickData[] = JSON.parse(post.stats.clicks);
          
          clicksData.forEach((clickData) => {
            const url = clickData.url;
            const domain = new URL(url).hostname;
            
            if (urlClickMap.has(url)) {
              const existing = urlClickMap.get(url)!;
              existing.totalClicks += clickData.total_clicks;
              existing.totalUniqueClicks += clickData.total_unique_clicks;
              existing.totalEmailClicks += clickData.email.clicks;
              existing.totalWebClicks += clickData.web.clicks;
              existing.totalEmailUniqueClicks += clickData.email.unique_clicks;
              existing.totalWebUniqueClicks += clickData.web.unique_clicks;
              existing.posts += 1;
              
              // Adicionar título do post se não existir
              if (!existing.postTitles.includes(post.title)) {
                existing.postTitles.push(post.title);
              }
              
              // Atualizar data mais recente
              if (post.publishDate && post.publishDate > existing.lastSeen) {
                existing.lastSeen = post.publishDate;
              }
            } else {
              urlClickMap.set(url, {
                url,
                totalClicks: clickData.total_clicks,
                totalUniqueClicks: clickData.total_unique_clicks,
                totalEmailClicks: clickData.email.clicks,
                totalWebClicks: clickData.web.clicks,
                totalEmailUniqueClicks: clickData.email.unique_clicks,
                totalWebUniqueClicks: clickData.web.unique_clicks,
                avgClickThroughRate: clickData.total_click_through_rate,
                posts: 1,
                lastSeen: post.publishDate || new Date(),
                domain,
                postTitles: [post.title],
              });
            }
          });
        } catch (error) {
          console.error(`Erro ao processar cliques do post ${post.id}:`, error);
        }
      }
    });

    // Converter para array e ordenar por total de cliques
    const urlAnalytics = Array.from(urlClickMap.values())
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 50); // Top 50 URLs

    // Calcular estatísticas gerais
    const totalUrls = urlClickMap.size;
    const totalClicksAll = Array.from(urlClickMap.values())
      .reduce((sum, url) => sum + url.totalClicks, 0);
    const totalUniqueClicksAll = Array.from(urlClickMap.values())
      .reduce((sum, url) => sum + url.totalUniqueClicks, 0);

    // Agrupar por domínio
    const domainStats = new Map<string, {
      domain: string;
      totalClicks: number;
      totalUniqueClicks: number;
      urlCount: number;
    }>();

    urlClickMap.forEach((urlData) => {
      if (domainStats.has(urlData.domain)) {
        const existing = domainStats.get(urlData.domain)!;
        existing.totalClicks += urlData.totalClicks;
        existing.totalUniqueClicks += urlData.totalUniqueClicks;
        existing.urlCount += 1;
      } else {
        domainStats.set(urlData.domain, {
          domain: urlData.domain,
          totalClicks: urlData.totalClicks,
          totalUniqueClicks: urlData.totalUniqueClicks,
          urlCount: 1,
        });
      }
    });

    const topDomains = Array.from(domainStats.values())
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 10);

    console.log(`✅ [URL Analytics] Processadas ${totalPostsAnalyzed} posts da publicação ${publication.name}`);
    console.log(`   └─ ${totalUrls} URLs únicas encontradas`);
    console.log(`   └─ ${totalClicksAll.toLocaleString("pt-BR")} cliques totais`);
    console.log(`   └─ ${totalUniqueClicksAll.toLocaleString("pt-BR")} cliques únicos`);

    const data = {
      publication: {
        id: publication.id,
        name: publication.name,
        description: publication.description,
      },
      urlAnalytics,
      topDomains,
      summary: {
        totalUrls,
        totalClicks: totalClicksAll,
        totalUniqueClicks: totalUniqueClicksAll,
        totalPostsAnalyzed,
        avgClicksPerUrl: totalUrls > 0 ? Math.round(totalClicksAll / totalUrls) : 0,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar analytics de URLs da publicação:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados de URLs da publicação" },
      { status: 500 }
    );
  }
}
