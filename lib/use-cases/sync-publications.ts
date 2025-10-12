import { IPublicationRepository } from "@/lib/interfaces/repositories";
import { IBeehiivService } from "@/lib/interfaces/services";

// Single Responsibility Principle - Responsável apenas por sincronizar publicações
// Open/Closed Principle - Aberto para extensão (pode adicionar novos métodos), fechado para modificação
// Dependency Inversion Principle - Depende de abstrações (interfaces), não de implementações concretas

export class SyncPublicationsUseCase {
  constructor(
    private publicationRepository: IPublicationRepository,
    private beehiivService: IBeehiivService
  ) {}

  async execute(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      // Buscar publicações do Beehiiv
      const beehiivPublications = await this.beehiivService.getPublications();

      let syncedCount = 0;

      for (const beehiivPub of beehiivPublications) {
        // Verificar se publicação já existe
        const existingPublication = await this.publicationRepository.findByBeehiivId(
          beehiivPub.id
        );

        if (!existingPublication) {
          // Criar nova publicação
          await this.publicationRepository.create({
            beehiivId: beehiivPub.id,
            name: beehiivPub.name,
            description: beehiivPub.description,
            userId,
          });
          syncedCount++;
        } else {
          // Atualizar publicação existente se necessário
          await this.publicationRepository.update(existingPublication.id, {
            name: beehiivPub.name,
            description: beehiivPub.description,
          });
        }
      }

      return { success: true, count: syncedCount };
    } catch (error) {
      console.error("Error syncing publications:", error);
      throw new Error("Failed to sync publications");
    }
  }
}
