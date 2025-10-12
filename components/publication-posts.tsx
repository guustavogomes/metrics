"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Mail,
  Eye,
  ExternalLink,
  Clock,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Filter,
  X,
  Search,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { SyncProgressIndicator } from "./sync-progress-indicator";

interface PostStats {
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  totalSent: number;
}

interface Post {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  publishDate: string | null;
  subjectLine?: string;
  previewText?: string;
  thumbnailUrl?: string;
  webUrl: string;
  audience: string;
  authors: string[];
  stats?: PostStats | null;
}

interface PublicationPostsProps {
  publicationId: string;
}

const statusColors = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sent: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusLabels = {
  confirmed: "Publicado",
  draft: "Rascunho",
  scheduled: "Agendado",
  sent: "Enviado",
};

export function PublicationPosts({ publicationId }: PublicationPostsProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minOpenRate, setMinOpenRate] = useState("");
  const [maxOpenRate, setMaxOpenRate] = useState("");
  const [minClickRate, setMinClickRate] = useState("");
  const [maxClickRate, setMaxClickRate] = useState("");

  // Construir URL com filtros
  const buildQueryUrl = () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
    });

    if (searchTerm) params.set("search", searchTerm);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (minOpenRate) params.set("minOpenRate", minOpenRate);
    if (maxOpenRate) params.set("maxOpenRate", maxOpenRate);
    if (minClickRate) params.set("minClickRate", minClickRate);
    if (maxClickRate) params.set("maxClickRate", maxClickRate);

    return `/api/publications/${publicationId}/posts?${params.toString()}`;
  };

  // Buscar posts da API
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "publication-posts",
      publicationId,
      currentPage,
      searchTerm,
      dateFrom,
      dateTo,
      minOpenRate,
      maxOpenRate,
      minClickRate,
      maxClickRate,
    ],
    queryFn: async () => {
      const response = await fetch(buildQueryUrl());
      if (!response.ok) throw new Error("Erro ao buscar posts");
      const json = await response.json();
      
      // Log para debug
      console.log("📥 Posts recebidos:", json.data?.length);
      if (json.data?.length > 0) {
        console.log("📊 Primeiro post tem stats?", json.data[0].stats ? "SIM" : "NÃO");
        if (json.data[0].stats) {
          console.log("📊 Stats do primeiro post:", json.data[0].stats);
        }
      }
      
      return json;
    },
  });

  // Mutation para sincronizar posts
  const syncPostsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/publications/${publicationId}/posts/sync`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Erro ao sincronizar posts");
      return response.json();
    },
    onSuccess: (data) => {
      const message = data.stats.isIncremental 
        ? `✅ ${data.stats.total} posts sincronizados (incremental)`
        : `✅ ${data.stats.total} posts sincronizados!`;
      
      // Invalidar cache para recarregar posts
      queryClient.invalidateQueries({
        queryKey: ["publication-posts", publicationId],
      });

      // APENAS sincronizar estatísticas se houver posts NOVOS
      if (data.stats.newPosts > 0) {
        toast.success(`${message} - ${data.stats.newPosts} novos!`);
        // Iniciar sincronização de estatísticas apenas para posts novos
        syncStatsMutation.mutate();
      } else {
        toast.success(`${message} - Nenhum post novo encontrado.`);
        console.log("⏭️  Pulando sincronização de stats (nenhum post novo)");
      }
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar posts");
      console.error(error);
    },
  });

  // Mutation para sincronizar estatísticas
  const syncStatsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/publications/${publicationId}/posts/sync-stats`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Erro ao sincronizar estatísticas");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.stats.total} estatísticas sincronizadas!`);
      // Invalidar cache novamente para mostrar as stats
      queryClient.invalidateQueries({
        queryKey: ["publication-posts", publicationId],
      });
      // Forçar refetch imediato
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: ["publication-posts", publicationId],
        });
      }, 500);
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar estatísticas");
      console.error(error);
    },
  });

  const toggleExpand = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const handleSync = () => {
    toast.info("Iniciando sincronização de posts...");
    syncPostsMutation.mutate();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setMinOpenRate("");
    setMaxOpenRate("");
    setMinClickRate("");
    setMaxClickRate("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    dateFrom ||
    dateTo ||
    minOpenRate ||
    maxOpenRate ||
    minClickRate ||
    maxClickRate;

  const posts = data?.data || [];
  const pagination = data?.pagination;
  const isSyncing = syncPostsMutation.isPending || syncStatsMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Edições Publicadas</h3>
          <p className="text-sm text-slate-600">
            {isLoading 
              ? "Carregando..." 
              : pagination 
                ? `${pagination.totalResults} ${pagination.totalResults === 1 ? 'edição publicada' : 'edições publicadas'}` 
                : "Nenhuma edição publicada ainda"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="default" className="ml-2 bg-blue-600 text-xs px-1.5 py-0">
                {[searchTerm, dateFrom, dateTo, minOpenRate, maxOpenRate, minClickRate, maxClickRate].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {syncPostsMutation.isPending ? "Posts..." : "Stats..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Sincronizar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avançados
              </h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>

            {/* Busca por Título */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Buscar por título
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Digite uma ou mais palavras..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">
                Busca por múltiplas palavras (ex: &quot;trump china&quot;)
              </p>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Data inicial
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Data final
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Filtros de Taxa de Abertura */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Taxa de abertura mínima (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 20"
                  value={minOpenRate}
                  onChange={(e) => {
                    setMinOpenRate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Taxa de abertura máxima (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 80"
                  value={maxOpenRate}
                  onChange={(e) => {
                    setMaxOpenRate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Filtros de Taxa de Cliques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Taxa de cliques mínima (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 5"
                  value={minClickRate}
                  onChange={(e) => {
                    setMinClickRate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Taxa de cliques máxima (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Ex: 30"
                  value={maxClickRate}
                  onChange={(e) => {
                    setMaxClickRate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de Progresso */}
      {isSyncing && (
        <SyncProgressIndicator
          publicationId={publicationId}
          isSyncing={isSyncing}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-slate-600">Carregando edições...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-sm text-red-700">Erro ao carregar edições. Tente novamente.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 mb-2">
            Nenhuma edição encontrada
          </h4>
          <p className="text-sm text-slate-600 mb-4">
            Clique em &quot;Sincronizar&quot; para importar suas edições do Beehiiv
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {!isLoading && posts.map((post: Post) => {
          const isExpanded = expandedPost === post.id;
          const statusKey = post.status as keyof typeof statusColors;

          return (
            <Card
              key={post.id}
              className="border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpand(post.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status Badge */}
                      <Badge className={`${statusColors[statusKey]} mb-3 border`}>
                        {statusLabels[statusKey]}
                      </Badge>

                      {/* Title */}
                      <h4 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        {post.title}
                        {post.subtitle && (
                          <span className="text-sm font-normal text-slate-500">
                            • {post.subtitle}
                          </span>
                        )}
                      </h4>

                      {/* Subject Line */}
                      {post.subjectLine && (
                        <div className="flex items-start gap-2 mb-3">
                          <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium text-slate-700">
                            {post.subjectLine}
                          </p>
                        </div>
                      )}

                      {/* Preview Text */}
                      {post.previewText && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {post.previewText}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {post.publishDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publishDate).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                        {post.authors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {post.authors.join(", ")}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.audience === "free" ? "Gratuito" : "Premium"}
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    {post.thumbnailUrl && (
                      <div className="w-32 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={post.thumbnailUrl}
                          alt={post.title}
                          width={128}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Expand Button */}
                    <button
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(post.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Stats */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-slate-700 mb-3">
                          Estatísticas
                        </h5>
                        {post.stats ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <p className="text-xs text-slate-500">Aberturas</p>
                              <p className="text-lg font-bold text-slate-900">
                                {post.stats.uniqueOpens.toLocaleString("pt-BR")}
                              </p>
                              <p className="text-xs text-blue-600">
                                {post.stats.openRate.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <p className="text-xs text-slate-500">Cliques</p>
                              <p className="text-lg font-bold text-slate-900">
                                {post.stats.uniqueClicks.toLocaleString("pt-BR")}
                              </p>
                              <p className="text-xs text-green-600">
                                {post.stats.clickRate.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <p className="text-xs text-slate-500">Enviados</p>
                              <p className="text-lg font-bold text-slate-900">
                                {post.stats.totalSent.toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <p className="text-xs text-slate-500">CTR</p>
                              <p className="text-lg font-bold text-slate-900">
                                {((post.stats.uniqueClicks / post.stats.uniqueOpens) * 100 || 0).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800 mb-1">
                                  Estatísticas não disponíveis
                                </p>
                                <p className="text-xs text-amber-700">
                                  {post.status === "draft" 
                                    ? "Este post ainda é um rascunho" 
                                    : "A API do Beehiiv não retornou estatísticas para este post. Isso pode acontecer com posts muito recentes ou por limitações de permissão da API."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-slate-700 mb-3">Ações</h5>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(post.webUrl, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver no Beehiiv
                          </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/publications/${publicationId}/posts/${post.id}`;
                                  }}
                                  disabled={!post.stats}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  {post.stats ? "Ver Análise Completa" : "Métricas (Em breve)"}
                                </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage || isLoading}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Página Anterior
          </Button>
          
          <span className="text-sm text-slate-600">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage || isLoading}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Próxima Página
          </Button>
        </div>
      )}
    </div>
  );
}

