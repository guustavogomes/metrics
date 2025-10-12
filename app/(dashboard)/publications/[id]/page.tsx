"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calendar, BarChart2, FileText } from "lucide-react";
import Link from "next/link";
import { PublicationPosts } from "@/components/publication-posts";

export default function PublicationDetailPage() {
  const params = useParams();
  const publicationId = params.id as string;

  const { data: publication, isLoading: isLoadingPub } = useQuery({
    queryKey: ["publication", publicationId],
    queryFn: async () => {
      const response = await fetch(`/api/publications/${publicationId}`);
      if (!response.ok) throw new Error("Failed to fetch publication");
      return response.json();
    },
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["publication-metrics", publicationId],
    queryFn: async () => {
      const response = await fetch(`/api/publications/${publicationId}/metrics?days=30`);
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: !!publicationId,
  });

  if (isLoadingPub) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando publicação...</p>
        </div>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Publicação não encontrada</p>
          <Link href="/publications">
            <Button>Voltar para publicações</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/publications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {publication.name}
          </h2>
          <p className="text-slate-600">
            {publication.description || "Sem descrição"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Edições
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6 mt-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              Métricas calculadas automaticamente dos posts dos últimos 30 dias
            </p>
          </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingMetrics ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando métricas...</span>
              </div>
            </CardContent>
          </Card>
        ) : metrics ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Inscritos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.summary.totalSubscribers.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Base atual de inscritos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Abertura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.summary.openRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Cliques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.summary.clickRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Novos Inscritos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.summary.totalNewSubs.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Nenhuma métrica disponível. Sincronize as métricas para visualizar os dados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Publicação</CardTitle>
              <CardDescription>Detalhes e configurações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Beehiiv ID</p>
                  <p className="text-sm font-mono">{publication.beehiivId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(publication.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última atualização</p>
                  <p className="text-sm">
                    {new Date(publication.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <PublicationPosts publicationId={publicationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
