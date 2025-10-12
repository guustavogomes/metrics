import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PublicationRepository } from "@/lib/repositories/publication-repository";

const publicationRepository = new PublicationRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publication = await publicationRepository.findById(params.id);

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    // Verificar se a publicação pertence ao usuário
    if (publication.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(publication);
  } catch (error) {
    console.error("Error fetching publication:", error);
    return NextResponse.json(
      { error: "Failed to fetch publication" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publication = await publicationRepository.findById(params.id);

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    if (publication.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const updated = await publicationRepository.update(params.id, {
      name,
      description,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating publication:", error);
    return NextResponse.json(
      { error: "Failed to update publication" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publication = await publicationRepository.findById(params.id);

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    if (publication.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await publicationRepository.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting publication:", error);
    return NextResponse.json(
      { error: "Failed to delete publication" },
      { status: 500 }
    );
  }
}
