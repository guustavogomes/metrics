# Exemplos de Uso - Use Cases

Este documento mostra como utilizar os Use Cases criados seguindo os princípios SOLID.

## 1. Sincronizar Publicações do Beehiiv

```typescript
import { PublicationRepository } from "@/lib/repositories/publication-repository";
import { BeehiivService } from "@/lib/services/beehiiv-service";
import { SyncPublicationsUseCase } from "@/lib/use-cases/sync-publications";

// Criar instâncias das dependências
const publicationRepository = new PublicationRepository();
const beehiivService = new BeehiivService(process.env.BEEHIIV_API_KEY);

// Criar o Use Case injetando as dependências
const syncPublicationsUseCase = new SyncPublicationsUseCase(
  publicationRepository,
  beehiivService
);

// Executar a sincronização
const result = await syncPublicationsUseCase.execute(userId);
console.log(`Sincronizadas ${result.count} publicações`);
```

### Exemplo de API Route

```typescript
// app/api/sync/publications/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PublicationRepository } from "@/lib/repositories/publication-repository";
import { BeehiivService } from "@/lib/services/beehiiv-service";
import { SyncPublicationsUseCase } from "@/lib/use-cases/sync-publications";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicationRepository = new PublicationRepository();
    const beehiivService = new BeehiivService();
    const useCase = new SyncPublicationsUseCase(publicationRepository, beehiivService);

    const result = await useCase.execute(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sync publications" },
      { status: 500 }
    );
  }
}
```

## 2. Sincronizar Métricas

```typescript
import { MetricRepository } from "@/lib/repositories/metric-repository";
import { PublicationRepository } from "@/lib/repositories/publication-repository";
import { BeehiivService } from "@/lib/services/beehiiv-service";
import { SyncMetricsUseCase } from "@/lib/use-cases/sync-metrics";

const metricRepository = new MetricRepository();
const publicationRepository = new PublicationRepository();
const beehiivService = new BeehiivService();

const syncMetricsUseCase = new SyncMetricsUseCase(
  metricRepository,
  publicationRepository,
  beehiivService
);

// Sincronizar últimos 30 dias
const result = await syncMetricsUseCase.execute(publicationId, 30);
console.log(`Sincronizadas ${result.count} métricas`);
```

### Exemplo de API Route

```typescript
// app/api/publications/[id]/sync-metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MetricRepository } from "@/lib/repositories/metric-repository";
import { PublicationRepository } from "@/lib/repositories/publication-repository";
import { BeehiivService } from "@/lib/services/beehiiv-service";
import { SyncMetricsUseCase } from "@/lib/use-cases/sync-metrics";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { days = 30 } = await request.json();

    const metricRepository = new MetricRepository();
    const publicationRepository = new PublicationRepository();
    const beehiivService = new BeehiivService();

    const useCase = new SyncMetricsUseCase(
      metricRepository,
      publicationRepository,
      beehiivService
    );

    const result = await useCase.execute(params.id, days);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sync metrics" },
      { status: 500 }
    );
  }
}
```

## 3. Buscar Métricas de uma Publicação

```typescript
import { MetricRepository } from "@/lib/repositories/metric-repository";
import { PublicationRepository } from "@/lib/repositories/publication-repository";
import { GetPublicationMetricsUseCase } from "@/lib/use-cases/get-publication-metrics";

const metricRepository = new MetricRepository();
const publicationRepository = new PublicationRepository();

const getMetricsUseCase = new GetPublicationMetricsUseCase(
  metricRepository,
  publicationRepository
);

// Buscar métricas dos últimos 30 dias
const data = await getMetricsUseCase.execute(publicationId, 30);

console.log(`Publicação: ${data.publication.name}`);
console.log(`Total de Inscritos: ${data.summary.totalSubscribers}`);
console.log(`Taxa de Abertura: ${data.summary.openRate}%`);
console.log(`Taxa de Cliques: ${data.summary.clickRate}%`);
```

### Exemplo de API Route

```typescript
// app/api/publications/[id]/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MetricRepository } from "@/lib/repositories/metric-repository";
import { PublicationRepository } from "@/lib/repositories/publication-repository";
import { GetPublicationMetricsUseCase } from "@/lib/use-cases/get-publication-metrics";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const metricRepository = new MetricRepository();
    const publicationRepository = new PublicationRepository();

    const useCase = new GetPublicationMetricsUseCase(
      metricRepository,
      publicationRepository
    );

    const data = await useCase.execute(params.id, days);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get metrics" },
      { status: 500 }
    );
  }
}
```

## 4. Usar com React Query em Componentes

```typescript
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

function PublicationMetrics({ publicationId }: { publicationId: string }) {
  // Query para buscar métricas
  const { data, isLoading, error } = useQuery({
    queryKey: ["publication-metrics", publicationId],
    queryFn: async () => {
      const response = await fetch(`/api/publications/${publicationId}/metrics?days=30`);
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });

  // Mutation para sincronizar métricas
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/publications/${publicationId}/sync-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });
      if (!response.ok) throw new Error("Failed to sync metrics");
      return response.json();
    },
    onSuccess: () => {
      // Invalidar query para refetch
      queryClient.invalidateQueries({ queryKey: ["publication-metrics", publicationId] });
    },
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar métricas</div>;

  return (
    <div>
      <h2>{data.publication.name}</h2>
      <div className="grid gap-4">
        <MetricCard
          title="Total de Inscritos"
          value={data.summary.totalSubscribers}
        />
        <MetricCard
          title="Taxa de Abertura"
          value={`${data.summary.openRate}%`}
        />
        <MetricCard
          title="Taxa de Cliques"
          value={`${data.summary.clickRate}%`}
        />
      </div>
      <button onClick={() => syncMutation.mutate()}>
        {syncMutation.isPending ? "Sincronizando..." : "Sincronizar Métricas"}
      </button>
    </div>
  );
}
```

## 5. Testes Unitários com Dependências Mock

Um dos benefícios do SOLID é a facilidade de testar:

```typescript
// __tests__/use-cases/sync-publications.test.ts
import { SyncPublicationsUseCase } from "@/lib/use-cases/sync-publications";
import { IPublicationRepository } from "@/lib/interfaces/repositories";
import { IBeehiivService } from "@/lib/interfaces/services";

describe("SyncPublicationsUseCase", () => {
  it("should sync publications from Beehiiv", async () => {
    // Mock dos repositórios e serviços
    const mockPublicationRepo: IPublicationRepository = {
      create: jest.fn(),
      findByBeehiivId: jest.fn().mockResolvedValue(null),
      // ... outros métodos
    };

    const mockBeehiivService: IBeehiivService = {
      getPublications: jest.fn().mockResolvedValue([
        { id: "123", name: "Test Newsletter", description: "Test" },
      ]),
      // ... outros métodos
    };

    const useCase = new SyncPublicationsUseCase(
      mockPublicationRepo,
      mockBeehiivService
    );

    const result = await useCase.execute("user-id");

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(mockPublicationRepo.create).toHaveBeenCalledTimes(1);
  });
});
```

## Vantagens da Arquitetura SOLID

1. **Testabilidade**: Fácil criar testes com mocks
2. **Manutenibilidade**: Código organizado e fácil de entender
3. **Extensibilidade**: Fácil adicionar novos Use Cases
4. **Reutilização**: Repositórios e serviços podem ser usados em múltiplos Use Cases
5. **Desacoplamento**: Mudanças em um componente não afetam outros
