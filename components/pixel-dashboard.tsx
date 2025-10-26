"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Sun, Moon, TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

interface PixelData {
  stats: {
    morning: {
      total: number;
      average: number;
      uniqueReaders: number;
      trend: number;
    };
    night: {
      total: number;
      average: number;
      uniqueReaders: number;
      trend: number;
    };
    sunday: {
      total: number;
      average: number;
      uniqueReaders: number;
      trend: number;
    };
  };
  dailyData: Array<{ date: string; morning: number; night: number; sunday: number }>;
  weekdayData: Array<{ day: string; morning: number; night: number; sunday: number }>;
  comparisonData: {
    morning: {
      before: { avgUniqueReaders: number; totalDays: number };
      after: { avgUniqueReaders: number; totalDays: number };
      change: number;
    };
    night: {
      before: { avgUniqueReaders: number; totalDays: number };
      after: { avgUniqueReaders: number; totalDays: number };
      change: number;
    };
  };
  nightLaunchDate: string;
}

export function PixelDashboard() {
  const [dateRange, setDateRange] = useState("7");
  const [data, setData] = useState<PixelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/pixel/stats?days=${dateRange}`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError("Erro ao carregar dados");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || "Erro ao carregar dados"}</p>
      </div>
    );
  }

  const { stats, dailyData, weekdayData, comparisonData, nightLaunchDate } = data;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Período:</label>
          <div className="flex gap-2">
            {["7", "30", "90"].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === days
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {days === "90" ? "3 meses" : `${days} dias`}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Edição Manhã */}
        <Card className="p-6 border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Sun className="h-5 w-5" />
                <span className="text-sm font-semibold">Edição Manhã</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.morning.total.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Média: {stats.morning.average} aberturas únicas/dia
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{stats.morning.trend}%</span>
            </div>
          </div>
        </Card>

        {/* Edição Noite */}
        <Card className="p-6 border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Moon className="h-5 w-5" />
                <span className="text-sm font-semibold">Edição Noite</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.night.total.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Média: {stats.night.average} aberturas únicas/dia
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{stats.night.trend}%</span>
            </div>
          </div>
        </Card>

        {/* Edição Domingo */}
        <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-semibold">Edição Domingo</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.sunday.total.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Média: {stats.sunday.average} aberturas únicas/dia
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{stats.sunday.trend}%</span>
            </div>
          </div>
        </Card>

        {/* Comparação */}
        <Card className="p-6 border-l-4 border-l-slate-500 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Activity className="h-5 w-5" />
                <span className="text-sm font-semibold">Performance</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {((stats.morning.total / stats.night.total) * 100 - 100).toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Manhã vs Noite
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Card de Impacto da Edição Noite */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Impacto da Edição Noite
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Evolução da audiência: primeiros meses (Ago-Set) vs últimos meses (Out+)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Edição Manhã - Comparação */}
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-600">Edição Manhã</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Ago-Set/2025:</span>
                <span className="font-semibold text-slate-900">
                  {comparisonData.morning.before.avgUniqueReaders.toLocaleString()} leitores/dia
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Out/2025+:</span>
                <span className="font-semibold text-slate-900">
                  {comparisonData.morning.after.avgUniqueReaders.toLocaleString()} leitores/dia
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-700 font-medium">Variação:</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  comparisonData.morning.change >= 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {comparisonData.morning.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    {comparisonData.morning.change >= 0 ? '+' : ''}
                    {comparisonData.morning.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edição Noite - Comparação */}
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600">Edição Noite</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Ago-Set/2025:</span>
                <span className="font-semibold text-slate-900">
                  {comparisonData.night.before.avgUniqueReaders > 0
                    ? `${comparisonData.night.before.avgUniqueReaders.toLocaleString()} leitores/dia`
                    : 'Dados insuficientes'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Out/2025+:</span>
                <span className="font-semibold text-slate-900">
                  {comparisonData.night.after.avgUniqueReaders.toLocaleString()} leitores/dia
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  comparisonData.night.change >= 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {comparisonData.night.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">
                    {comparisonData.night.change >= 0 ? '+' : ''}
                    {comparisonData.night.change.toFixed(1)}% de evolução
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights do Impacto */}
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-purple-100">
          <p className="text-sm text-slate-700">
            <strong>Análise:</strong>{' '}
            {comparisonData.morning.change < -5 ? (
              <span className="text-red-700">
                A edição manhã teve uma queda de {Math.abs(comparisonData.morning.change).toFixed(1)}% nos últimos meses,
                indicando possível migração de audiência para a edição noite ou redução geral de engajamento.
              </span>
            ) : comparisonData.morning.change > 5 ? (
              <span className="text-green-700">
                A edição manhã cresceu {comparisonData.morning.change.toFixed(1)}% nos últimos meses,
                mostrando que as duas edições se complementam e expandem a audiência total.
              </span>
            ) : (
              <span className="text-blue-700">
                A edição manhã manteve estabilidade ({comparisonData.morning.change >= 0 ? '+' : ''}{comparisonData.morning.change.toFixed(1)}%)
                ao longo do período, indicando que a edição noite atingiu um público diferente ou adicional.
              </span>
            )}
          </p>
        </div>
      </Card>

      {/* Gráfico de Evolução Diária */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Evolução Diária de Aberturas Únicas</h3>
          <p className="text-sm text-slate-600 mt-1">
            Comparação de leitores únicos entre edições da manhã e noite
          </p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="morning"
              name="Manhã"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              label={{ position: 'top', fill: '#f59e0b', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="night"
              name="Noite"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              label={{ position: 'bottom', fill: '#6366f1', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="sunday"
              name="Domingo"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              label={{ position: 'top', fill: '#10b981', fontSize: 11 }}
            />
            {/* Linha vertical marcando início do segundo período de análise */}
            <ReferenceLine
              x="01/10"
              stroke="#9333ea"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'Outubro - Novo Período',
                position: 'top',
                fill: '#9333ea',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico por Dia da Semana */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Aberturas Únicas por Dia da Semana</h3>
          <p className="text-sm text-slate-600 mt-1">
            Análise de leitores únicos ao longo da semana
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={weekdayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="morning" name="Manhã" fill="#f59e0b" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#f59e0b', fontSize: 11 }} />
            <Bar dataKey="night" name="Noite" fill="#6366f1" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#6366f1', fontSize: 11 }} />
            <Bar dataKey="sunday" name="Domingo" fill="#10b981" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#10b981', fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">💡 Insights</h3>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            • A edição da manhã tem <strong>{((stats.morning.total / stats.night.total) * 100 - 100).toFixed(1)}% mais leitores únicos</strong> do que a edição noturna.
          </p>
          <p>
            • A edição de domingo alcança <strong>{stats.sunday.total.toLocaleString()} leitores únicos</strong> por edição, mostrando engajamento nos fins de semana.
          </p>
          <p>
            • No total, o Pixel rastreia <strong>{(stats.morning.total + stats.night.total + stats.sunday.total).toLocaleString()} aberturas únicas</strong> no período.
          </p>
        </div>
      </Card>
    </div>
  );
}
