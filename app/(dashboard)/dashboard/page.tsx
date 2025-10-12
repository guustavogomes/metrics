import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, TrendingUp, Newspaper, Sparkles, CheckCircle2, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const stats = [
    {
      name: "Total de Inscritos",
      value: "0",
      description: "Configure sua integração",
      icon: Users,
      color: "bg-blue-500",
      trend: "+0%"
    },
    {
      name: "Taxa de Abertura",
      value: "0%",
      description: "Últimos 30 dias",
      icon: Mail,
      color: "bg-green-500",
      trend: "+0%"
    },
    {
      name: "Novos Inscritos",
      value: "0",
      description: "Últimos 7 dias",
      icon: TrendingUp,
      color: "bg-purple-500",
      trend: "+0%"
    },
    {
      name: "Publicações Ativas",
      value: "0",
      description: "Total cadastrado",
      icon: Newspaper,
      color: "bg-orange-500",
      trend: "+0"
    }
  ];

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">
                      {stat.name}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                      <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Passos */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Próximos Passos</CardTitle>
                <CardDescription>
                  Configure para começar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Configure API Key</p>
                <p className="text-sm text-slate-600 mt-1">
                  Obtenha sua chave nas configurações do Beehiiv
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Adicione Publicações</p>
                <p className="text-sm text-slate-600 mt-1">
                  Sincronize suas newsletters
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Visualize Métricas</p>
                <p className="text-sm text-slate-600 mt-1">
                  Acompanhe em tempo real
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status da Integração */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Status da Integração</CardTitle>
                <CardDescription>
                  Verifique sua configuração
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-2xl">🔑</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">API Key</p>
                  <p className="text-sm text-slate-500">Não configurada</p>
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-slate-400"></div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-2xl">📰</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Publicações</p>
                  <p className="text-sm text-slate-500">0 sincronizadas</p>
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-slate-400"></div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Métricas</p>
                  <p className="text-sm text-slate-500">Aguardando dados</p>
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-slate-400"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
