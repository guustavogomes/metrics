import { prisma } from "@/lib/prisma";
import { IMetricRepository } from "@/lib/interfaces/repositories";
import { MetricDTO, CreateMetricInput } from "@/lib/types";

// Single Responsibility Principle - Responsável apenas por operações de dados de métricas
export class MetricRepository implements IMetricRepository {
  async create(data: CreateMetricInput): Promise<MetricDTO> {
    return await prisma.metric.create({
      data,
    });
  }

  async findById(id: string): Promise<MetricDTO | null> {
    return await prisma.metric.findUnique({
      where: { id },
    });
  }

  async findByPublicationId(publicationId: string, limit?: number): Promise<MetricDTO[]> {
    return await prisma.metric.findMany({
      where: { publicationId },
      orderBy: { date: "desc" },
      take: limit,
    });
  }

  async findByDateRange(
    publicationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MetricDTO[]> {
    return await prisma.metric.findMany({
      where: {
        publicationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });
  }

  async upsert(data: CreateMetricInput): Promise<MetricDTO> {
    return await prisma.metric.upsert({
      where: {
        publicationId_date: {
          publicationId: data.publicationId,
          date: data.date,
        },
      },
      update: {
        subscribers: data.subscribers,
        opens: data.opens,
        clicks: data.clicks,
        unsubscribes: data.unsubscribes,
        newSubs: data.newSubs,
      },
      create: data,
    });
  }

  async deleteOlderThan(publicationId: string, date: Date): Promise<void> {
    await prisma.metric.deleteMany({
      where: {
        publicationId,
        date: {
          lt: date,
        },
      },
    });
  }
}
