"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Mail,
  TrendingUp,
  Newspaper,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
  MousePointerClick,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: overview, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/overview");
      if (!response.ok) throw new Error("Failed to fetch overview");
      return response.json();
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Bem-vindo de volta, {session?.user?.name || "Usuário"}! 👋
          </h2>
          <p className="text-slate-600 mt-2">
            Aqui está um resumo das suas newsletters
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 font-medium">Carregando métricas...</p>
          </div>
        </div>
      ) : overview ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total de Inscritos */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-semibold text-blue-50">
                  Total de Inscritos
                </p>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight">
                  {overview.totalSubscribers.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-blue-100">
                  Base atual de assinantes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Taxa de Abertura */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-semibold text-emerald-50">
                  Taxa de Abertura
                </p>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Mail className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold tracking-tight">
                    {overview.openRate}%
                  </p>
                  {overview.openRate >= 30 && (
                    <ArrowUpRight className="h-5 w-5 text-emerald-200" />
                  )}
                </div>
                <p className="text-sm text-emerald-100">
                  {overview.openRate >= 30
                    ? "Excelente performance"
                    : overview.openRate >= 20
                    ? "Bom desempenho"
                    : "Últimos 30 dias"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Novos Inscritos */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-semibold text-violet-50">
                  Novos Inscritos
                </p>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold tracking-tight">
                    {overview.newSubscribers.toLocaleString("pt-BR")}
                  </p>
                  {overview.newSubscribers > 0 && (
                    <ArrowUpRight className="h-5 w-5 text-violet-200" />
                  )}
                </div>
                <p className="text-sm text-violet-100">
                  Últimos 7 dias
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Publicações Ativas */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-semibold text-amber-50">
                  Publicações Ativas
                </p>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Newspaper className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight">
                  {overview.totalPublications}
                </p>
                <p className="text-sm text-amber-100">
                  {overview.totalPosts} posts sincronizados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-600">Erro ao carregar métricas</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Passos */}
        <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Próximos Passos</CardTitle>
                <CardDescription>
                  Configure para começar a usar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Link href="/publications" className="block">
              <div className="flex items-start gap-4 group p-4 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Visualize suas Publicações
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Acesse a página de publicações e sincronize suas newsletters
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>

            <div className="flex items-start gap-4 group p-4 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-200 transition-all duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold group-hover:bg-green-600 group-hover:text-white transition-colors">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors">
                  Sincronize Posts
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Importe suas edições do Beehiiv com um clique
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group p-4 rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Analise Métricas
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Acompanhe performance com gráficos elegantes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status da Integração */}
        <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Status da Integração</CardTitle>
                <CardDescription>
                  Verifique sua configuração atual
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!isLoading && overview && (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl">🔑</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">API Key</p>
                      <p className="text-sm text-green-700 font-medium">✓ Configurada</p>
                    </div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl">📰</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Publicações</p>
                      <p className="text-sm text-blue-700 font-medium">
                        {overview.totalPublications} {overview.totalPublications === 1 ? "sincronizada" : "sincronizadas"}
                      </p>
                    </div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Métricas</p>
                      <p className="text-sm text-purple-700 font-medium">
                        {overview.totalPosts} posts com dados
                      </p>
                    </div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-purple-500 animate-pulse shadow-lg shadow-purple-500/50"></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
