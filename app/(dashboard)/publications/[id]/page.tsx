"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calendar, BarChart2, FileText, TrendingUp, Users, Mail, MousePointerClick, UserPlus, ArrowUpRight, ArrowDownRight, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { PublicationPosts } from "@/components/publication-posts";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { PerformanceBarChart } from "@/components/charts/performance-bar-chart";
import { DistributionPieChart } from "@/components/charts/distribution-pie-chart";
import { CumulativeAreaChart } from "@/components/charts/cumulative-area-chart";
import { RatesLineChart } from "@/components/charts/rates-line-chart";
import UrlAnalytics from "@/components/url-analytics";

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

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["publication-analytics", publicationId],
    queryFn: async () => {
      const response = await fetch(`/api/publications/${publicationId}/analytics?days=30`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
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
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="urls" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            URLs
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingMetrics ? (
          <Card className="col-span-full border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600 font-medium">Carregando métricas...</span>
              </div>
            </CardContent>
          </Card>
        ) : metrics ? (
          <>
            {/* Card 1: Total de Inscritos */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-blue-50">
                  Total de Inscritos
                </CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold mb-1 tracking-tight">
                  {metrics.summary.totalSubscribers.toLocaleString("pt-BR")}
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <p className="text-sm">Base atual de inscritos</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Taxa de Abertura */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-50">
                  Taxa de Abertura
                </CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Mail className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold mb-1 tracking-tight">
                  {metrics.summary.openRate}%
                </div>
                <div className="flex items-center gap-2">
                  {metrics.summary.openRate >= 30 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                      <p className="text-sm text-emerald-100">Excelente performance</p>
                    </>
                  ) : metrics.summary.openRate >= 20 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                      <p className="text-sm text-emerald-100">Bom desempenho</p>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-emerald-200" />
                      <p className="text-sm text-emerald-100">Últimos 30 dias</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Taxa de Cliques */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-violet-50">
                  Taxa de Cliques
                </CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <MousePointerClick className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold mb-1 tracking-tight">
                  {metrics.summary.clickRate}%
                </div>
                <div className="flex items-center gap-2">
                  {metrics.summary.clickRate >= 20 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-violet-200" />
                      <p className="text-sm text-violet-100">Alto engajamento</p>
                    </>
                  ) : metrics.summary.clickRate >= 15 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-violet-200" />
                      <p className="text-sm text-violet-100">Bom engajamento</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-violet-100">Últimos 30 dias</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Novos Inscritos */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-amber-50">
                  Novos Inscritos
                </CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold mb-1 tracking-tight">
                  {metrics.summary.totalNewSubs.toLocaleString("pt-BR")}
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-amber-200" />
                  <p className="text-sm text-amber-100">Crescimento em 30 dias</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="col-span-full border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <p className="text-center text-amber-800 font-medium">
                ⚠️ Nenhuma métrica disponível. Sincronize as métricas para visualizar os dados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-md">
            <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Informações da Publicação</CardTitle>
                  <CardDescription>Detalhes e configurações da newsletter</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Beehiiv ID</p>
                  </div>
                  <p className="text-sm font-mono text-slate-900 break-all">{publication.beehiivId}</p>
                </div>
                
                <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Criado em</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(publication.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                
                <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Última atualização</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
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

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Carregando analytics...</p>
              </div>
            </div>
          ) : analytics ? (
            <>
              {/* Cards de Resumo */}
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">
                      Total de Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {analytics.summary.totalPosts}
                    </div>
                    <p className="text-xs text-blue-700">Últimos 30 dias</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">
                      Total de Aberturas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {analytics.summary.totalOpens.toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-green-700">Aberturas únicas</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900">
                      Total de Cliques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {analytics.summary.totalClicks.toLocaleString("pt-BR")}
                    </div>
                    <p className="text-xs text-purple-700">Cliques únicos</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-900">
                      CTR Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {analytics.summary.ctr}%
                    </div>
                    <p className="text-xs text-orange-700">Click-Through Rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Linha: Tendência de Aberturas e Cliques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Tendência de Engajamento
                  </CardTitle>
                  <CardDescription>
                    Aberturas e cliques únicos ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.charts.timeSeries.length > 0 ? (
                    <TimeSeriesChart data={analytics.charts.timeSeries} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível para este período
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Grid: Taxa de Abertura/Clique + Pizza */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-green-600" />
                      Taxas de Performance
                    </CardTitle>
                    <CardDescription>
                      Taxa de abertura e clique com benchmarks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.charts.timeSeries.length > 0 ? (
                      <RatesLineChart data={analytics.charts.timeSeries} />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-purple-600" />
                      Distribuição de Performance
                    </CardTitle>
                    <CardDescription>
                      Classificação dos posts por taxa de abertura
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.charts.distribution.some((d: any) => d.value > 0) ? (
                      <DistributionPieChart data={analytics.charts.distribution} />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Barras: Performance Comparativa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-orange-600" />
                    Performance dos Últimos Posts
                  </CardTitle>
                  <CardDescription>
                    Comparação de aberturas e cliques dos 10 posts mais recentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.charts.performance.length > 0 ? (
                    <PerformanceBarChart data={analytics.charts.performance} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Área: Crescimento Acumulado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Crescimento Acumulado
                  </CardTitle>
                  <CardDescription>
                    Evolução acumulada de aberturas e cliques no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.charts.cumulative.length > 0 ? (
                    <CumulativeAreaChart data={analytics.charts.cumulative} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Card de Insights */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">💡 Insights e Recomendações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Taxa de abertura média: {analytics.summary.avgOpenRate}%
                      </p>
                      <p className="text-xs text-blue-700">
                        {analytics.summary.avgOpenRate >= 30
                          ? "✅ Excelente! Acima do benchmark de 30%"
                          : analytics.summary.avgOpenRate >= 20
                          ? "✅ Bom desempenho! Continue assim"
                          : "⚠️ Abaixo do benchmark. Considere melhorar subject lines"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Taxa de clique média: {analytics.summary.avgClickRate}%
                      </p>
                      <p className="text-xs text-blue-700">
                        {analytics.summary.avgClickRate >= 20
                          ? "✅ Excelente engajamento de conteúdo!"
                          : analytics.summary.avgClickRate >= 15
                          ? "✅ Bom engajamento!"
                          : "⚠️ Considere melhorar CTAs e relevância do conteúdo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        CTR: {analytics.summary.ctr}%
                      </p>
                      <p className="text-xs text-blue-700">
                        {parseFloat(analytics.summary.ctr) >= 5
                          ? "✅ Ótimo! Seu público está altamente engajado"
                          : "💡 Teste diferentes posições e formatos de links"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum dado de analytics disponível. Sincronize os posts para visualizar analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="urls" className="mt-6">
          <UrlAnalytics publicationId={publicationId} />
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <PublicationPosts publicationId={publicationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
