"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SyncProgress {
  publicationId: string;
  type: "posts" | "stats";
  status: "running" | "completed" | "error";
  current: number;
  total: number;
  percentage: number;
  message: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface SyncProgressIndicatorProps {
  publicationId: string;
  isSyncing: boolean;
}

export function SyncProgressIndicator({
  publicationId,
  isSyncing,
}: SyncProgressIndicatorProps) {
  const [postsProgress, setPostsProgress] = useState<SyncProgress | null>(null);
  const [statsProgress, setStatsProgress] = useState<SyncProgress | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (!isSyncing) {
      // Manter progresso por mais 3 segundos após completar
      const timeout = setTimeout(() => {
        setPostsProgress(null);
        setStatsProgress(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    // Buscar imediatamente ao iniciar
    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `/api/publications/${publicationId}/posts/sync-progress`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("📊 Progresso atualizado:", data.progress);
          
          if (data.progress.posts) {
            setPostsProgress(data.progress.posts);
          }
          if (data.progress.stats) {
            setStatsProgress(data.progress.stats);
          }
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error("Erro ao buscar progresso:", error);
      }
    };

    // Buscar imediatamente
    fetchProgress();

    // Polling a cada 1 segundo para melhor responsividade
    const interval = setInterval(fetchProgress, 1000);

    return () => clearInterval(interval);
  }, [publicationId, isSyncing]);

  // Não mostrar se não houver progresso
  if (!postsProgress && !statsProgress) {
    return null;
  }

  const renderProgressBar = (progress: SyncProgress | null, title: string) => {
    if (!progress) return null;

    const Icon =
      progress.status === "completed"
        ? CheckCircle2
        : progress.status === "error"
        ? AlertCircle
        : Loader2;

    const colorClass =
      progress.status === "completed"
        ? "text-green-600"
        : progress.status === "error"
        ? "text-red-600"
        : "text-blue-600";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${colorClass} ${
                progress.status === "running" ? "animate-spin" : ""
              }`}
            />
            <span className="text-sm font-medium text-slate-700">{title}</span>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {progress.current.toLocaleString("pt-BR")} / {progress.total.toLocaleString("pt-BR")} ({progress.percentage}%)
          </span>
        </div>
        <div className="relative">
          <Progress
            value={progress.percentage}
            className={`h-2.5 transition-all duration-500 ${
              progress.status === "completed"
                ? "[&>div]:bg-green-500 bg-green-100"
                : progress.status === "error"
                ? "[&>div]:bg-red-500 bg-red-100"
                : "[&>div]:bg-blue-500 bg-blue-100"
            }`}
          />
        </div>
        <p className="text-xs text-slate-600 flex items-center gap-1">
          {progress.message}
          {progress.status === "running" && (
            <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-pulse ml-1"></span>
          )}
        </p>
        {progress.error && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-600">❌ Erro: {progress.error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            Progresso da Sincronização
          </h4>
          <span className="text-xs text-slate-500">
            Atualizado há {Math.round((Date.now() - lastUpdate) / 1000)}s
          </span>
        </div>
        {renderProgressBar(postsProgress, "📝 Sincronização de Posts")}
        {statsProgress && <div className="h-px bg-slate-200 my-2"></div>}
        {renderProgressBar(statsProgress, "📊 Sincronização de Estatísticas")}
      </CardContent>
    </Card>
  );
}

