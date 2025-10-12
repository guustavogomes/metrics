import { IMetricRepository, IPublicationRepository } from "@/lib/interfaces/repositories";
import { IBeehiivService } from "@/lib/interfaces/services";

// Single Responsibility Principle - Responsável apenas por sincronizar métricas
// Dependency Inversion Principle - Depende de abstrações (interfaces), não de implementações

export class SyncMetricsUseCase {
  constructor(
    private metricRepository: IMetricRepository,
    private publicationRepository: IPublicationRepository,
    private beehiivService: IBeehiivService
  ) {}

  async execute(publicationId: string, days = 30): Promise<{ success: boolean; count: number }> {
    try {
      // Buscar publicação
      const publication = await this.publicationRepository.findById(publicationId);
      if (!publication) {
        throw new Error("Publication not found");
      }

      // Calcular datas
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar métricas do Beehiiv
      const beehiivMetrics = await this.beehiivService.getMetrics(
        publication.beehiivId,
        startDate,
        endDate
      );

      let syncedCount = 0;

      for (const metric of beehiivMetrics) {
        // Upsert métrica (cria se não existe, atualiza se existe)
        await this.metricRepository.upsert({
          publicationId: publication.id,
          date: new Date(metric.date),
          subscribers: metric.subscribers,
          opens: metric.opens,
          clicks: metric.clicks,
          unsubscribes: metric.unsubscribes,
          newSubs: metric.new_subscribers,
        });
        syncedCount++;
      }

      return { success: true, count: syncedCount };
    } catch (error) {
      console.error("Error syncing metrics:", error);
      throw new Error("Failed to sync metrics");
    }
  }
}
