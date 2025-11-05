import { RevenueDashboard } from "@/components/revenue-dashboard";

export const metadata = {
  title: "Monetização | Métricas",
  description: "Dashboard de monetização e receita de anúncios",
};

export default function RevenuePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          💰 Monetização
        </h1>
        <p className="text-slate-600 mt-1">
          Análise de receita e performance de anúncios
        </p>
      </div>

      <RevenueDashboard />
    </div>
  );
}

