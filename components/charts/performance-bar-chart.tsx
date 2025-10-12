"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PerformanceBarChartProps {
  data: Array<{
    title: string;
    opens: number;
    clicks: number;
  }>;
}

export function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="title"
          stroke="#64748b"
          style={{ fontSize: "11px" }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ color: "#1e293b", fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
        <Bar
          dataKey="opens"
          name="Aberturas"
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="clicks"
          name="Cliques"
          fill="#22c55e"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

