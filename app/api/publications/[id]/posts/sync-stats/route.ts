import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncProgressStore } from "@/lib/sync-progress-store";

interface BeehiivEmailStats {
  recipients: number;
  delivered: number;
  opens: number;
  unique_opens: number;
  open_rate: number;
  clicks: number;
  unique_clicks: number;
  click_rate: number;
  unsubscribes: number;
  spam_reports: number;
}

interface BeehiivPostWithStats {
  id: string;
  title: string;
  status: string;
  stats?: {
    email: BeehiivEmailStats;
    web?: any;
    clicks?: any[];
  };
}

interface BeehiivApiResponse {
  data: BeehiivPostWithStats;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const publicationId = params.id;

    // Buscar a publicação no banco para pegar o beehiivId
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

    // Buscar apenas posts com status "confirmed" QUE NÃO TÊM ESTATÍSTICAS
    // ou que foram atualizados recentemente (últimas 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const posts = await prisma.post.findMany({
      where: {
        publicationId: publicationId,
        status: "confirmed",
        publishDate: {
          not: null,
        },
        OR: [
          // Posts sem estatísticas
          {
            stats: null,
          },
          // Posts atualizados nas últimas 24h (podem ter novos dados)
          {
            updatedAt: {
              gte: oneDayAgo,
            },
          },
        ],
      },
      include: {
        stats: true,
      },
    });

    console.log(`🔄 Sincronizando estatísticas de ${posts.length} posts (sem stats ou recentes)...`);

    // Se não há posts para sincronizar, retornar sucesso imediatamente
    if (posts.length === 0) {
      console.log("✅ Nenhum post precisa de sincronização de estatísticas!");
      return NextResponse.json({
        success: true,
        message: "Nenhuma estatística precisa ser sincronizada",
        stats: {
          newStats: 0,
          updatedStats: 0,
          skipped: 0,
          total: 0,
          totalProcessed: 0,
        },
      });
    }

    // Iniciar rastreamento de progresso
    syncProgressStore.start(publicationId, "stats", posts.length);

    let totalSynced = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const post of posts) {
      try {
        const apiUrl = `https://api.beehiiv.com/v2/publications/${publication.beehiivId}/posts/${post.beehiivId}?expand=stats`;
        console.log(`📊 Buscando stats do post: ${post.title}`);
        console.log(`   URL: ${apiUrl}`);

        // Buscar estatísticas do post na API do Beehiiv
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${beehiivApiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(
            `⚠️  Erro ao buscar stats do post ${post.beehiivId}: ${response.statusText}`
          );
          totalSkipped++;
          
          // Atualizar progresso mesmo com erro
          const currentTotal = totalSynced + totalUpdated + totalSkipped;
          syncProgressStore.update(
            publicationId,
            "stats",
            currentTotal,
            `${currentTotal}/${posts.length} posts processados...`
          );
          
          continue;
        }

        const apiResponse: BeehiivApiResponse = await response.json();
        const postData = apiResponse.data;
        
        // Verificar se o post tem estatísticas
        if (!postData.stats || !postData.stats.email) {
          console.warn(`⚠️  Post ${post.beehiivId} (${post.title}) não tem estatísticas ainda`);
          console.warn(`   Status: ${post.status}, Publish Date: ${post.publishDate}`);
          totalSkipped++;
          
          // Atualizar progresso mesmo sem stats
          const currentTotal = totalSynced + totalUpdated + totalSkipped;
          syncProgressStore.update(
            publicationId,
            "stats",
            currentTotal,
            `${currentTotal}/${posts.length} posts processados...`
          );
          
          continue;
        }

        const emailStats = postData.stats.email;
        
        console.log(`✅ Stats encontradas para "${post.title}":`, {
          opens: emailStats.unique_opens,
          clicks: emailStats.unique_clicks,
          sent: emailStats.recipients,
          delivered: emailStats.delivered,
          clicksData: postData.stats.clicks ? `${postData.stats.clicks.length} URLs` : 'nenhuma',
        });

        // Calcular métricas derivadas
        const deliveredRate = emailStats.recipients > 0 
          ? (emailStats.delivered / emailStats.recipients) * 100 
          : 0;
        
        const unsubscribeRate = emailStats.delivered > 0
          ? (emailStats.unsubscribes / emailStats.delivered) * 100
          : 0;

        const bounces = emailStats.recipients - emailStats.delivered;
        
        const clickThroughRate = emailStats.unique_opens > 0
          ? (emailStats.unique_clicks / emailStats.unique_opens) * 100
          : 0;

        // Serializar dados de cliques (URLs) como JSON
        const clicksJson = postData.stats.clicks 
          ? JSON.stringify(postData.stats.clicks)
          : null;

        const statsData = {
          uniqueOpens: emailStats.unique_opens || 0,
          uniqueClicks: emailStats.unique_clicks || 0,
          openRate: emailStats.open_rate || 0,
          clickRate: emailStats.click_rate || 0,
          clickThroughRate: clickThroughRate,
          totalSent: emailStats.recipients || 0,
          bounces: bounces,
          delivered: emailStats.delivered || 0,
          deliveredRate: deliveredRate,
          spamReports: emailStats.spam_reports || 0,
          unsubscribes: emailStats.unsubscribes || 0,
          unsubscribeRate: unsubscribeRate,
          clicks: clicksJson,
        };

        if (post.stats) {
          // Atualizar estatísticas existentes
          await prisma.postStats.update({
            where: { postId: post.id },
            data: statsData,
          });
          totalUpdated++;
          console.log(`✅ Stats atualizadas: ${post.title}`);
        } else {
          // Criar novas estatísticas
          await prisma.postStats.create({
            data: {
              ...statsData,
              postId: post.id,
            },
          });
          totalSynced++;
          console.log(`✅ Stats criadas: ${post.title}`);
        }

        // Atualizar progresso
        const currentTotal = totalSynced + totalUpdated + totalSkipped;
        syncProgressStore.update(
          publicationId,
          "stats",
          currentTotal,
          `${currentTotal}/${posts.length} posts processados...`
        );

        // Delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`❌ Erro ao processar stats do post ${post.id}:`, error);
        totalSkipped++;
        
        // Atualizar progresso mesmo em caso de erro
        const currentTotal = totalSynced + totalUpdated + totalSkipped;
        syncProgressStore.update(
          publicationId,
          "stats",
          currentTotal,
          `${currentTotal}/${posts.length} posts processados...`
        );
      }
    }

    console.log(`🎉 Sincronização de estatísticas concluída!`);
    console.log(`   - Novas estatísticas: ${totalSynced}`);
    console.log(`   - Estatísticas atualizadas: ${totalUpdated}`);
    console.log(`   - Ignorados: ${totalSkipped}`);

    // Marcar progresso como completo
    syncProgressStore.complete(
      publicationId,
      "stats",
      `✅ ${totalSynced + totalUpdated} estatísticas sincronizadas${totalSkipped > 0 ? ` (${totalSkipped} ignorados)` : ""}`
    );

    return NextResponse.json({
      success: true,
      message: "Estatísticas sincronizadas com sucesso",
      stats: {
        newStats: totalSynced,
        updatedStats: totalUpdated,
        skipped: totalSkipped,
        total: totalSynced + totalUpdated,
        totalProcessed: posts.length,
      },
    });
  } catch (error) {
    console.error("Erro ao sincronizar estatísticas:", error);
    
    // Marcar progresso como erro
    syncProgressStore.error(
      params.id,
      "stats",
      error instanceof Error ? error.message : "Erro desconhecido"
    );
    
    return NextResponse.json(
      {
        error: "Erro ao sincronizar estatísticas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

