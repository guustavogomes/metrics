import { Suspense } from "react";
import { PixelDashboard } from "@/components/pixel-dashboard";

export const metadata = {
  title: "Pixel Analytics | Waffle Metrics",
  description: "Análise de leituras por edição (manhã vs noite)",
};

export default function PixelPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Pixel Analytics
          </h1>
          <p className="text-slate-600 mt-1">
            Análise comparativa de leituras: Edição Manhã vs Edição Noite
          </p>
        </div>
      </div>

      {/* Dashboard */}
      <Suspense fallback={<div className="text-center py-12">Carregando dados...</div>}>
        <PixelDashboard />
      </Suspense>
    </div>
  );
}
