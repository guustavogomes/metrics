// DTOs (Data Transfer Objects)
export interface PublicationDTO {
  id: string;
  beehiivId: string;
  name: string;
  description?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricDTO {
  id: string;
  publicationId: string;
  date: Date;
  subscribers: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  newSubs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BeehiivPublicationResponse {
  id: string;
  name: string;
  description?: string;
}

export interface BeehiivMetricsResponse {
  publication_id: string;
  date: string;
  subscribers: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  new_subscribers: number;
}

export interface CreatePublicationInput {
  beehiivId: string;
  name: string;
  description?: string;
  userId: string;
}

export interface CreateMetricInput {
  publicationId: string;
  date: Date;
  subscribers: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  newSubs: number;
}
