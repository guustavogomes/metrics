import { NextResponse } from "next/server";
import { syncProgressStore } from "@/lib/sync-progress-store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const publicationId = params.id;
    const progress = syncProgressStore.getAll(publicationId);

    console.log(`📊 [GET /sync-progress] Publication: ${publicationId}`, {
      posts: progress.posts ? `${progress.posts.status} - ${progress.posts.percentage}%` : "null",
      stats: progress.stats ? `${progress.stats.status} - ${progress.stats.percentage}%` : "null",
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar progresso",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

