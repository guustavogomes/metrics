import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const { id: publicationId, postId } = params;

    // Buscar post com estatísticas
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        stats: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o post pertence à publicação
    if (post.publicationId !== publicationId) {
      return NextResponse.json(
        { error: "Post não pertence a esta publicação" },
        { status: 403 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Erro ao buscar post:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

