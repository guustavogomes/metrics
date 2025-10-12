import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const publicationId = params.id;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // confirmed, draft, sent
    const search = searchParams.get("search"); // busca por título
    const dateFrom = searchParams.get("dateFrom"); // filtro data início
    const dateTo = searchParams.get("dateTo"); // filtro data fim
    const minOpenRate = searchParams.get("minOpenRate"); // taxa mínima de abertura
    const maxOpenRate = searchParams.get("maxOpenRate"); // taxa máxima de abertura
    const minClickRate = searchParams.get("minClickRate"); // taxa mínima de cliques
    const maxClickRate = searchParams.get("maxClickRate"); // taxa máxima de cliques
    const sortBy = searchParams.get("sortBy") || "publishDate"; // campo de ordenação
    const sortOrder = searchParams.get("sortOrder") || "desc"; // ordem (asc/desc)

    // Verificar se a publicação existe
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publicação não encontrada" },
        { status: 404 }
      );
    }

    // Construir filtros - padrão: apenas posts confirmed
    const where: any = {
      publicationId: publicationId,
    };

    if (status) {
      where.status = status;
    } else {
      // Por padrão, mostrar apenas posts confirmados (publicados)
      where.status = "confirmed";
    }

    // Filtro de busca por título (case-insensitive, múltiplas palavras)
    if (search) {
      const searchTerms = search.trim().split(/\s+/);
      where.OR = searchTerms.map((term) => ({
        title: {
          contains: term,
          mode: "insensitive",
        },
      }));
    }

    // Filtro por data de publicação
    if (dateFrom || dateTo) {
      where.publishDate = {};
      if (dateFrom) {
        where.publishDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Adicionar 1 dia para incluir todo o dia final
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.publishDate.lt = endDate;
      }
    }

    // Filtros de estatísticas (open rate, click rate)
    // Esses filtros precisam ser aplicados após a query, pois envolvem relações
    const needsStatsFilter =
      minOpenRate || maxOpenRate || minClickRate || maxClickRate;

    // Buscar posts com paginação (sem ordenação inicial)
    let posts = await prisma.post.findMany({
      where,
      include: {
        stats: true,
      },
    });

    // Ordenar: posts COM stats primeiro, depois por data de publicação (mais recentes)
    posts.sort((a, b) => {
      // Priorizar posts com estatísticas não-zeradas
      const aHasStats = a.stats !== null && a.stats.uniqueOpens > 0;
      const bHasStats = b.stats !== null && b.stats.uniqueOpens > 0;
      
      if (aHasStats && !bHasStats) return -1;
      if (!aHasStats && bHasStats) return 1;
      
      // Se ambos têm ou não têm stats, ordenar por data (mais recentes primeiro)
      const aDate = a.publishDate?.getTime() || 0;
      const bDate = b.publishDate?.getTime() || 0;
      return bDate - aDate; // desc por padrão
    });

    // Aplicar filtros de estatísticas
    if (needsStatsFilter) {
      posts = posts.filter((post) => {
        if (!post.stats) return false;

        if (minOpenRate && post.stats.openRate < parseFloat(minOpenRate)) {
          return false;
        }
        if (maxOpenRate && post.stats.openRate > parseFloat(maxOpenRate)) {
          return false;
        }
        if (minClickRate && post.stats.clickRate < parseFloat(minClickRate)) {
          return false;
        }
        if (maxClickRate && post.stats.clickRate > parseFloat(maxClickRate)) {
          return false;
        }

        return true;
      });
    }

    // Aplicar paginação após filtros
    const totalCount = posts.length;
    const paginatedPosts = posts.slice((page - 1) * limit, page * limit);

    const totalPages = Math.ceil(totalCount / limit);

    // Log para debug
    const postsWithStats = paginatedPosts.filter(p => p.stats !== null).length;
    console.log(`📊 [GET /posts] Retornando ${paginatedPosts.length} posts, ${postsWithStats} têm estatísticas`);
    if (paginatedPosts.length > 0 && paginatedPosts[0].stats) {
      console.log(`📊 [GET /posts] Primeiro post stats:`, {
        uniqueOpens: paginatedPosts[0].stats.uniqueOpens,
        uniqueClicks: paginatedPosts[0].stats.uniqueClicks,
      });
    }

    return NextResponse.json({
      data: paginatedPosts,
      pagination: {
        page,
        limit,
        totalResults: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

