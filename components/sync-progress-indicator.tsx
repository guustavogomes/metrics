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
  const [keepPolling, setKeepPolling] = useState(false);

  useEffect(() => {
    console.log(`🔄 SyncProgressIndicator - isSyncing: ${isSyncing}, keepPolling: ${keepPolling}`);
    
    // Buscar imediatamente ao iniciar
    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `/api/publications/${publicationId}/posts/sync-progress`
        );
        if (response.ok) {
          const data = await response.json();
          
          const hasRunningProgress = 
            data.progress.posts?.status === "running" || 
            data.progress.stats?.status === "running";
          
          console.log("📊 Progresso atualizado:", {
            posts: data.progress.posts?.status,
            stats: data.progress.stats?.status,
            hasRunning: hasRunningProgress,
            postsMsg: data.progress.posts?.message,
            statsMsg: data.progress.stats?.message,
          });
          
          if (data.progress.posts) {
            setPostsProgress(data.progress.posts);
          }
          if (data.progress.stats) {
            setStatsProgress(data.progress.stats);
          }
          
          // Continuar polling se houver qualquer progresso ativo
          setKeepPolling(hasRunningProgress);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error("❌ Erro ao buscar progresso:", error);
      }
    };

    // Se está sincronizando OU se deve continuar polling, fazer polling
    const shouldPoll = isSyncing || keepPolling;
    console.log(`🔍 shouldPoll: ${shouldPoll} (isSyncing: ${isSyncing}, keepPolling: ${keepPolling})`);
    
    if (shouldPoll) {
      // Buscar imediatamente
      fetchProgress();

      // Polling a cada 500ms para melhor responsividade
      const interval = setInterval(fetchProgress, 500);
      return () => {
        console.log("🛑 Limpando interval");
        clearInterval(interval);
      };
    } else if (postsProgress || statsProgress) {
      // Manter progresso por mais 3 segundos após completar
      console.log("⏰ Agendando limpeza do progresso em 3s");
      const timeout = setTimeout(() => {
        console.log("🧹 Limpando progresso");
        setPostsProgress(null);
        setStatsProgress(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [publicationId, isSyncing, keepPolling, postsProgress, statsProgress]);

  // Não mostrar se não houver progresso
  const shouldShow = postsProgress || statsProgress;
  console.log(`👁️ shouldShow: ${shouldShow}`, { postsProgress: !!postsProgress, statsProgress: !!statsProgress });
  
  if (!shouldShow) {
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

