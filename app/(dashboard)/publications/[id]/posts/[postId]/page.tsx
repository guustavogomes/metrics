"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Mail, 
  Eye, 
  MousePointerClick,
  Users,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ArrowUpRight,
  UserX,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const publicationId = params.id as string;
  const postId = params.postId as string;

  // Buscar dados do post
  const { data: post, isLoading } = useQuery({
    queryKey: ["post-detail", publicationId, postId],
    queryFn: async () => {
      const response = await fetch(`/api/publications/${publicationId}/posts/${postId}`);
      if (!response.ok) throw new Error("Failed to fetch post");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!post || !post.stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Estatísticas não disponíveis</p>
          <p className="text-muted-foreground mb-4">Este post ainda não possui dados estatísticos.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const stats = post.stats;
  const ctr = stats.uniqueOpens > 0 
    ? ((stats.uniqueClicks / stats.uniqueOpens) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {post.title}
          </h2>
          {post.subtitle && (
            <p className="text-slate-600 mt-1">{post.subtitle}</p>
          )}
        </div>
        <Button variant="outline" asChild>
          <a href={post.webUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver no Beehiiv
          </a>
        </Button>
      </div>

      {/* Informações do Post */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-md">
        <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900">Informações da Edição</CardTitle>
              <CardDescription>Detalhes e metadados da publicação</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data de Publicação</p>
              </div>
              <p className="text-sm font-medium text-slate-900">
                {post.publishDate
                  ? new Date(post.publishDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Não publicado"}
              </p>
            </div>
            
            <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assunto</p>
              </div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2">{post.subjectLine || "-"}</p>
            </div>
            
            <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Audiência</p>
              </div>
              <Badge variant="outline" className="border-green-300 text-green-700">
                {post.audience}
              </Badge>
            </div>
            
            <div className="group p-4 rounded-lg bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors">
                  <Send className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plataforma</p>
              </div>
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                {post.platform}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Taxa de Abertura */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-50">
              Taxa de Abertura
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Eye className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold mb-1 tracking-tight">
              {stats.openRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-200" />
              <p className="text-sm text-blue-100">
                {stats.uniqueOpens.toLocaleString("pt-BR")} aberturas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Taxa de Cliques */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-50">
              Taxa de Cliques
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <MousePointerClick className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold mb-1 tracking-tight">
              {stats.clickRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-200" />
              <p className="text-sm text-emerald-100">
                {stats.uniqueClicks.toLocaleString("pt-BR")} cliques
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: CTR */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-violet-50">
              CTR
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold mb-1 tracking-tight">
              {ctr}%
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-violet-100">
                Click-Through Rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Enviados */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-50">
              Total Enviados
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Send className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold mb-1 tracking-tight">
              {stats.totalSent.toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-200" />
              <p className="text-sm text-amber-100">
                Emails enviados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Detalhado */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Entrega */}
        <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Status de Entrega</CardTitle>
                <CardDescription>Performance de entrega dos emails</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Entregues</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-700">
                  {stats.delivered.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-green-600">{stats.deliveredRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Bounces</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-700">
                  {stats.bounces.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-red-600">
                  {((stats.bounces / stats.totalSent) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium">Spam Reports</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-700">
                  {stats.spamReports.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-amber-600">
                  {((stats.spamReports / stats.delivered) * 100).toFixed(3)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engajamento */}
        <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Engajamento</CardTitle>
                <CardDescription>Métricas de interação dos assinantes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Aberturas</span>
                <span className="text-2xl font-bold text-blue-700">{stats.openRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.openRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {stats.uniqueOpens.toLocaleString("pt-BR")} de {stats.totalSent.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Cliques</span>
                <span className="text-2xl font-bold text-green-700">{stats.clickRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.clickRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-green-700 mt-1">
                {stats.uniqueClicks.toLocaleString("pt-BR")} de {stats.uniqueOpens.toLocaleString("pt-BR")} que abriram
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">Unsubscribes</span>
                <span className="text-2xl font-bold text-red-700">{stats.unsubscribeRate.toFixed(2)}%</span>
              </div>
              <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.unsubscribeRate * 10, 100)}%` }}
                />
              </div>
              <p className="text-xs text-red-700 mt-1">
                {stats.unsubscribes.toLocaleString("pt-BR")} de {stats.delivered.toLocaleString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Texto */}
      {post.previewText && (
        <Card className="border-slate-200 bg-gradient-to-br from-purple-50 via-white to-purple-50 shadow-md">
          <CardHeader className="border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Texto de Pré-visualização</CardTitle>
                <CardDescription>Preview que aparece antes do assunto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700 italic text-sm leading-relaxed">&quot;{post.previewText}&quot;</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

