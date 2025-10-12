"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicationCard } from "@/components/publication-card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export default function PublicationsPage() {
  const { data: publications, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["publications"],
    queryFn: async () => {
      const response = await fetch("/api/publications");
      if (!response.ok) throw new Error("Failed to fetch publications");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando publicações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar publicações</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Minhas Publicações
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {publications?.length || 0} newsletter{publications?.length !== 1 ? 's' : ''} conectada{publications?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          {isRefetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </>
          )}
        </Button>
      </div>

      {publications && publications.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center px-4">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-700 mb-2 font-medium">
              Nenhuma publicação encontrada
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Execute o seed para cadastrar as publicações iniciais:
            </p>
            <code className="block mt-2 p-3 bg-slate-800 text-slate-100 rounded-lg text-sm font-mono">
              npm run seed
            </code>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {publications?.map((publication: any) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
      )}
    </div>
  );
}
