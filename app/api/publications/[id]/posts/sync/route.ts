import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncProgressStore } from "@/lib/sync-progress-store";

interface BeehiivPost {
  id: string;
  title: string;
  subtitle: string;
  authors: string[];
  created: number;
  status: string;
  publish_date: number | null;
  displayed_date: number | null;
  subject_line: string;
  preview_text: string;
  slug: string;
  thumbnail_url: string;
  web_url: string;
  audience: string;
  platform: string;
  content_tags: string[];
  hidden_from_feed: boolean;
}

interface BeehiivPostsResponse {
  data: BeehiivPost[];
  page: number;
  limit: number;
  total_results: number;
  total_pages: number;
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

    let totalSynced = 0;
    let totalUpdated = 0;
    let currentPage = 1;
    let hasMorePages = true;
    let consecutiveExistingPosts = 0;
    const MAX_CONSECUTIVE_EXISTING = 50; // Parar após 50 posts consecutivos já existentes

    console.log(`🔄 Iniciando sincronização incremental de posts da publicação ${publication.name}...`);

    // Iniciar rastreamento de progresso (estimativa inicial)
    syncProgressStore.start(publicationId, "posts", 100);

    while (hasMorePages) {
      console.log(`📄 Buscando página ${currentPage}...`);

      // Buscar posts da API do Beehiiv (apenas confirmed)
      const response = await fetch(
        `https://api.beehiiv.com/v2/publications/${publication.beehiivId}/posts?page=${currentPage}&limit=50&direction=desc&status=confirmed`,
        {
          headers: {
            Authorization: `Bearer ${beehiivApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Beehiiv API error: ${response.statusText}`);
      }

      const data: BeehiivPostsResponse = await response.json();

      // Atualizar progresso com total real após primeira página
      if (currentPage === 1 && data.total_results) {
        syncProgressStore.update(publicationId, "posts", 0, `Sincronizando ${data.total_results} posts...`);
        syncProgressStore.start(publicationId, "posts", data.total_results);
      }

      // Processar cada post
      for (const post of data.data) {
        try {
          // Verificar se o post já existe
          const existingPost = await prisma.post.findUnique({
            where: { beehiivId: post.id },
          });

          const postData = {
            beehiivId: post.id,
            publicationId: publicationId,
            title: post.title,
            subtitle: post.subtitle || null,
            authors: post.authors,
            status: post.status,
            publishDate: post.publish_date
              ? new Date(post.publish_date * 1000)
              : null,
            displayedDate: post.displayed_date
              ? new Date(post.displayed_date * 1000)
              : null,
            subjectLine: post.subject_line || null,
            previewText: post.preview_text || null,
            slug: post.slug,
            thumbnailUrl: post.thumbnail_url || null,
            webUrl: post.web_url,
            audience: post.audience,
            platform: post.platform,
            contentTags: post.content_tags,
            hiddenFromFeed: post.hidden_from_feed,
          };

          if (existingPost) {
            // Post já existe - atualizar apenas
            await prisma.post.update({
              where: { id: existingPost.id },
              data: postData,
            });
            totalUpdated++;
            consecutiveExistingPosts++;
            
            // Se encontramos muitos posts consecutivos já existentes, provavelmente já sincronizamos tudo
            if (consecutiveExistingPosts >= MAX_CONSECUTIVE_EXISTING) {
              console.log(`⚡ Encontrados ${MAX_CONSECUTIVE_EXISTING} posts consecutivos já sincronizados. Parando sincronização...`);
              hasMorePages = false;
              break;
            }
          } else {
            // Criar novo post
            await prisma.post.create({
              data: postData,
            });
            totalSynced++;
            consecutiveExistingPosts = 0; // Resetar contador quando encontramos post novo
          }

          // Atualizar progresso
          const currentTotal = totalSynced + totalUpdated;
          syncProgressStore.update(
            publicationId,
            "posts",
            currentTotal,
            `${currentTotal} posts processados...`
          );
        } catch (error) {
          console.error(`Erro ao processar post ${post.id}:`, error);
          
          // Atualizar progresso mesmo com erro
          const currentTotal = totalSynced + totalUpdated;
          syncProgressStore.update(
            publicationId,
            "posts",
            currentTotal,
            `${currentTotal} posts processados (com erros)...`
          );
        }
      }

      console.log(`✅ Página ${currentPage} processada: ${data.data.length} posts`);

      // Se já encontramos posts consecutivos suficientes, parar aqui
      if (consecutiveExistingPosts >= MAX_CONSECUTIVE_EXISTING) {
        break;
      }

      // Verificar se há mais páginas
      const hasMorePagesToFetch = currentPage < data.total_pages;
      hasMorePages = hasMorePagesToFetch;
      currentPage++;

      // Pequeno delay para não sobrecarregar a API
      if (hasMorePages) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const wasIncrementalStop = consecutiveExistingPosts >= MAX_CONSECUTIVE_EXISTING;

    // Verificar quantos posts estão sem estatísticas
    const postsWithoutStats = await prisma.post.count({
      where: {
        publicationId: publicationId,
        status: "confirmed",
        publishDate: {
          not: null,
        },
        stats: null,
      },
    });

    console.log(`🎉 Sincronização concluída!`);
    console.log(`   - Novos posts: ${totalSynced}`);
    console.log(`   - Posts atualizados: ${totalUpdated}`);
    console.log(`   - Posts sem estatísticas: ${postsWithoutStats}`);
    console.log(`   - Total de páginas processadas: ${currentPage - 1}`);
    if (wasIncrementalStop) {
      console.log(`   ⚡ Sincronização incremental: parou ao encontrar posts já sincronizados`);
    }
    if (totalSynced === 0 && postsWithoutStats === 0) {
      console.log(`   ℹ️  Nenhum post novo e todos têm estatísticas`);
    } else if (postsWithoutStats > 0) {
      console.log(`   ⚠️  ${postsWithoutStats} posts precisam de estatísticas - sync será executado`);
    }

    // Marcar progresso como completo
    syncProgressStore.complete(
      publicationId,
      "posts",
      wasIncrementalStop 
        ? `✅ ${totalSynced + totalUpdated} posts sincronizados (incremental)` 
        : `✅ ${totalSynced + totalUpdated} posts sincronizados`
    );

    return NextResponse.json({
      success: true,
      message: wasIncrementalStop 
        ? "Posts sincronizados (sincronização incremental)" 
        : "Posts sincronizados com sucesso",
      stats: {
        newPosts: totalSynced,
        updatedPosts: totalUpdated,
        postsWithoutStats,
        totalPages: currentPage - 1,
        total: totalSynced + totalUpdated,
        isIncremental: wasIncrementalStop,
      },
    });
  } catch (error) {
    console.error("Erro ao sincronizar posts:", error);
    
    // Marcar progresso como erro
    syncProgressStore.error(
      params.id,
      "posts",
      error instanceof Error ? error.message : "Erro desconhecido"
    );
    
    return NextResponse.json(
      {
        error: "Erro ao sincronizar posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

