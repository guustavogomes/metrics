"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

interface RatesLineChartProps {
  data: Array<{
    date: string;
    openRate: number;
    clickRate: number;
  }>;
}

export function RatesLineChart({ data }: RatesLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke="#64748b"
          style={{ fontSize: "12px" }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ color: "#1e293b", fontWeight: 600 }}
          formatter={(value: any) => `${value.toFixed(2)}%`}
        />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          iconType="circle"
        />
        {/* Linha de referência para 30% (boa taxa de abertura) */}
        <ReferenceLine
          y={30}
          label="Benchmark 30%"
          stroke="#10b981"
          strokeDasharray="3 3"
        />
        {/* Linha de referência para 15% (taxa mínima aceitável) */}
        <ReferenceLine
          y={15}
          label="Mínimo 15%"
          stroke="#f59e0b"
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="openRate"
          name="Taxa de Abertura"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="clickRate"
          name="Taxa de Cliques"
          stroke="#f59e0b"
          strokeWidth={3}
          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

