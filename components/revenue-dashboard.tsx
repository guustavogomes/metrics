"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, Calendar } from "lucide-react";
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
} from "recharts";

interface RevenueData {
  stats: {
    totalRevenue: number;
    morningRevenue: number;
    nightRevenue: number;
    avgMorningRPM: number;
    avgNightRPM: number;
    morningAdsCount: number;
    nightAdsCount: number;
    monetizationRate: number;
    avgMorningOpens: number;
    avgNightOpens: number;
  };
  timeSeries: Array<{
    date: string;
    morningRevenue: number;
    nightRevenue: number;
    totalRevenue: number;
    morningRPM: number;
    nightRPM: number;
    morningOpens: number;
    nightOpens: number;
  }>;
  topRevenue: Array<{
    date: string;
    totalRevenue: number;
    morningRevenue: number;
    nightRevenue: number;
    morningOpens: number;
    nightOpens: number;
  }>;
  topRPM: Array<{
    date: string;
    morningRPM: number;
    nightRPM: number;
    morningRevenue: number;
    nightRevenue: number;
    morningOpens: number;
    nightOpens: number;
  }>;
}

export function RevenueDashboard() {
  const [dateRange, setDateRange] = useState("30");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/revenue/stats?days=${dateRange}`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError("Erro ao carregar dados de monetização");
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-slate-600">Carregando dados de monetização...</p>
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

  const { stats, timeSeries, topRevenue, topRPM } = data;

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Formatador de data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

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
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receita Total */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Receita Total</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-1">Últimos {dateRange} dias</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        {/* Taxa de Monetização */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Taxa de Monetização</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {stats.monetizationRate.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {stats.morningAdsCount + stats.nightAdsCount} anúncios
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        {/* RPM Médio Manhã */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">RPM Manhã</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                {stats.avgMorningRPM > 0 ? formatCurrency(stats.avgMorningRPM) : "-"}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {stats.morningAdsCount} anúncios
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>
        </Card>

        {/* RPM Médio Noite */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">RPM Noite</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {stats.avgNightRPM > 0 ? formatCurrency(stats.avgNightRPM) : "-"}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {stats.nightAdsCount} anúncios
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Gráfico de Receita ao Longo do Tempo */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          Evolução da Receita
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="morningRevenue"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Manhã"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nightRevenue"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Noite"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              stroke="#10b981"
              strokeWidth={3}
              name="Total"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparação Manhã vs Noite */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receita por Edição */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Receita por Edição
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-amber-700">🌅 Manhã</span>
                <span className="text-sm font-bold text-amber-900">
                  {formatCurrency(stats.morningRevenue)}
                </span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-4">
                <div
                  className="bg-amber-500 h-4 rounded-full"
                  style={{
                    width: `${stats.totalRevenue > 0 ? (stats.morningRevenue / stats.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-purple-700">🌙 Noite</span>
                <span className="text-sm font-bold text-purple-900">
                  {formatCurrency(stats.nightRevenue)}
                </span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-4">
                <div
                  className="bg-purple-500 h-4 rounded-full"
                  style={{
                    width: `${stats.totalRevenue > 0 ? (stats.nightRevenue / stats.totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Top 5 Dias com Maior Receita */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            🏆 Top 5 Dias - Maior Receita
          </h3>
          <div className="space-y-3">
            {topRevenue.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(item.date).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-slate-600">
                      {item.morningRevenue > 0 && "🌅 "}
                      {item.nightRevenue > 0 && "🌙"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {formatCurrency(item.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

