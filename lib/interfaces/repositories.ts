import { PublicationDTO, MetricDTO, CreatePublicationInput, CreateMetricInput } from "@/lib/types";

// Interface Segregation Principle - Interfaces específicas para cada repositório

export interface IPublicationRepository {
  create(data: CreatePublicationInput): Promise<PublicationDTO>;
  findById(id: string): Promise<PublicationDTO | null>;
  findByUserId(userId: string): Promise<PublicationDTO[]>;
  findByBeehiivId(beehiivId: string): Promise<PublicationDTO | null>;
  update(id: string, data: Partial<CreatePublicationInput>): Promise<PublicationDTO>;
  delete(id: string): Promise<void>;
}

export interface IMetricRepository {
  create(data: CreateMetricInput): Promise<MetricDTO>;
  findById(id: string): Promise<MetricDTO | null>;
  findByPublicationId(publicationId: string, limit?: number): Promise<MetricDTO[]>;
  findByDateRange(publicationId: string, startDate: Date, endDate: Date): Promise<MetricDTO[]>;
  upsert(data: CreateMetricInput): Promise<MetricDTO>;
  deleteOlderThan(publicationId: string, date: Date): Promise<void>;
}
