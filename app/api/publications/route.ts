import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PublicationRepository } from "@/lib/repositories/publication-repository";

const publicationRepository = new PublicationRepository();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publications = await publicationRepository.findByUserId(session.user.id);

    return NextResponse.json(publications);
  } catch (error) {
    console.error("Error fetching publications:", error);
    return NextResponse.json(
      { error: "Failed to fetch publications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { beehiivId, name, description } = body;

    if (!beehiivId || !name) {
      return NextResponse.json(
        { error: "beehiivId and name are required" },
        { status: 400 }
      );
    }

    const publication = await publicationRepository.create({
      beehiivId,
      name,
      description,
      userId: session.user.id,
    });

    return NextResponse.json(publication, { status: 201 });
  } catch (error) {
    console.error("Error creating publication:", error);
    return NextResponse.json(
      { error: "Failed to create publication" },
      { status: 500 }
    );
  }
}
