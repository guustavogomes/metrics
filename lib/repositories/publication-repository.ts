import { prisma } from "@/lib/prisma";
import { IPublicationRepository } from "@/lib/interfaces/repositories";
import { PublicationDTO, CreatePublicationInput } from "@/lib/types";

// Single Responsibility Principle - Responsável apenas por operações de dados de publicações
export class PublicationRepository implements IPublicationRepository {
  async create(data: CreatePublicationInput): Promise<PublicationDTO> {
    return await prisma.publication.create({
      data,
    });
  }

  async findById(id: string): Promise<PublicationDTO | null> {
    return await prisma.publication.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<PublicationDTO[]> {
    return await prisma.publication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByBeehiivId(beehiivId: string): Promise<PublicationDTO | null> {
    return await prisma.publication.findUnique({
      where: { beehiivId },
    });
  }

  async update(id: string, data: Partial<CreatePublicationInput>): Promise<PublicationDTO> {
    return await prisma.publication.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.publication.delete({
      where: { id },
    });
  }
}
