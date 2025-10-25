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

  const { stats, dailyData, weekdayData } = data;

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
