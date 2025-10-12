import { IMetricRepository, IPublicationRepository } from "@/lib/interfaces/repositories";
import { MetricDTO } from "@/lib/types";

// Single Responsibility Principle - Responsável apenas por buscar métricas de uma publicação
// Dependency Inversion Principle - Depende de abstrações

export interface PublicationMetricsSummary {
  publication: {
    id: string;
    name: string;
  };
  summary: {
    totalSubscribers: number;
    totalOpens: number;
    totalClicks: number;
    totalUnsubscribes: number;
    totalNewSubs: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  };
  metrics: MetricDTO[];
}

export class GetPublicationMetricsUseCase {
  constructor(
    private metricRepository: IMetricRepository,
    private publicationRepository: IPublicationRepository
  ) {}

  async execute(publicationId: string, days = 30): Promise<PublicationMetricsSummary> {
    // Buscar publicação
    const publication = await this.publicationRepository.findById(publicationId);
    if (!publication) {
      throw new Error("Publication not found");
    }

    // Calcular datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar métricas
    const metrics = await this.metricRepository.findByDateRange(
      publicationId,
      startDate,
      endDate
    );

    // Calcular resumo
    const summary = this.calculateSummary(metrics);

    return {
      publication: {
        id: publication.id,
        name: publication.name,
      },
      summary,
      metrics,
    };
  }

  private calculateSummary(metrics: MetricDTO[]) {
    if (metrics.length === 0) {
      return {
        totalSubscribers: 0,
        totalOpens: 0,
        totalClicks: 0,
        totalUnsubscribes: 0,
        totalNewSubs: 0,
        openRate: 0,
        clickRate: 0,
        unsubscribeRate: 0,
      };
    }

    // Pegar a métrica mais recente para subscribers totais
    const latestMetric = metrics[0];
    const totalSubscribers = latestMetric.subscribers;

    // Somar valores do período
    const totals = metrics.reduce(
      (acc, metric) => ({
        opens: acc.opens + metric.opens,
        clicks: acc.clicks + metric.clicks,
        unsubscribes: acc.unsubscribes + metric.unsubscribes,
        newSubs: acc.newSubs + metric.newSubs,
      }),
      { opens: 0, clicks: 0, unsubscribes: 0, newSubs: 0 }
    );

    // Calcular taxas
    const openRate = totalSubscribers > 0 ? (totals.opens / totalSubscribers) * 100 : 0;
    const clickRate = totals.opens > 0 ? (totals.clicks / totals.opens) * 100 : 0;
    const unsubscribeRate =
      totalSubscribers > 0 ? (totals.unsubscribes / totalSubscribers) * 100 : 0;

    return {
      totalSubscribers,
      totalOpens: totals.opens,
      totalClicks: totals.clicks,
      totalUnsubscribes: totals.unsubscribes,
      totalNewSubs: totals.newSubs,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
    };
  }
}
