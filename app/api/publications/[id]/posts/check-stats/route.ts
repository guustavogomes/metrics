import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint para verificar status das estatísticas
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const publicationId = params.id;

    // Contar posts com e sem estatísticas
    const [totalConfirmed, postsWithStats, postsWithoutStats] = await Promise.all([
      prisma.post.count({
        where: {
          publicationId,
          status: "confirmed",
        },
      }),
      prisma.post.count({
        where: {
          publicationId,
          status: "confirmed",
          stats: {
            isNot: null,
          },
        },
      }),
      prisma.post.findMany({
        where: {
          publicationId,
          status: "confirmed",
          stats: null,
        },
        select: {
          title: true,
          publishDate: true,
        },
        take: 5,
        orderBy: {
          publishDate: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      totalConfirmed,
      postsWithStats,
      postsWithoutStats: totalConfirmed - postsWithStats,
      coveragePercentage: totalConfirmed > 0 
        ? Math.round((postsWithStats / totalConfirmed) * 100) 
        : 0,
      recentPostsWithoutStats: postsWithoutStats,
    });
  } catch (error) {
    console.error("Erro ao verificar estatísticas:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar estatísticas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

