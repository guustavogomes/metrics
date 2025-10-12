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
  Clock
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
      <Card>
        <CardHeader>
          <CardTitle>Informações da Edição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data de Publicação
              </p>
              <p className="text-sm font-medium mt-1">
                {post.publishDate
                  ? new Date(post.publishDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Não publicado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Assunto
              </p>
              <p className="text-sm font-medium mt-1">{post.subjectLine || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Audiência</p>
              <Badge variant="outline" className="mt-1">
                {post.audience}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Plataforma</p>
              <Badge variant="outline" className="mt-1">
                {post.platform}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Taxa de Abertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.openRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-600 mt-1">
              {stats.uniqueOpens.toLocaleString("pt-BR")} aberturas únicas
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-green-600" />
              Taxa de Cliques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.clickRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-600 mt-1">
              {stats.uniqueClicks.toLocaleString("pt-BR")} cliques únicos
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{ctr}%</div>
            <p className="text-xs text-slate-600 mt-1">
              Click-Through Rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {stats.totalSent.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Total de emails
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Detalhado */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📬 Status de Entrega</CardTitle>
            <CardDescription>Performance de entrega dos emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Engajamento</CardTitle>
            <CardDescription>Métricas de interação dos assinantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{post.previewText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

