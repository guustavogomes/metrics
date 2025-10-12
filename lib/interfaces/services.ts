import { BeehiivPublicationResponse, BeehiivMetricsResponse } from "@/lib/types";

// Interface Segregation Principle - Interfaces específicas para serviços externos

export interface IBeehiivService {
  getPublications(): Promise<BeehiivPublicationResponse[]>;
  getPublicationById(id: string): Promise<BeehiivPublicationResponse | null>;
  getMetrics(publicationId: string, startDate?: Date, endDate?: Date): Promise<BeehiivMetricsResponse[]>;
}
