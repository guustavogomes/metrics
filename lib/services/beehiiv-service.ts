import { IBeehiivService } from "@/lib/interfaces/services";
import { BeehiivPublicationResponse, BeehiivMetricsResponse } from "@/lib/types";

// Single Responsibility Principle - Responsável apenas pela integração com a API do Beehiiv
export class BeehiivService implements IBeehiivService {
  private apiKey: string;
  private baseUrl = "https://api.beehiiv.com/v2";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BEEHIIV_API_KEY || "";
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Beehiiv API error (${response.status}):`, errorText);
      throw new Error(`Beehiiv API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPublications(): Promise<BeehiivPublicationResponse[]> {
    try {
      const data = await this.fetch<{ data: BeehiivPublicationResponse[] }>("/publications");
      return data.data || [];
    } catch (error) {
      console.error("Error fetching publications from Beehiiv:", error);
      return [];
    }
  }

  async getPublicationById(id: string): Promise<BeehiivPublicationResponse | null> {
    try {
      const data = await this.fetch<{ data: BeehiivPublicationResponse }>(`/publications/${id}`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching publication ${id} from Beehiiv:`, error);
      return null;
    }
  }

  async getMetrics(
    publicationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BeehiivMetricsResponse[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate.toISOString().split('T')[0]);
      if (endDate) params.append("end_date", endDate.toISOString().split('T')[0]);

      const endpoint = `/publications/${publicationId}/stats/email${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await this.fetch<{ data: BeehiivMetricsResponse[] }>(endpoint);
      return data.data || [];
    } catch (error) {
      console.error(`Error fetching metrics for publication ${publicationId}:`, error);
      return [];
    }
  }
}
