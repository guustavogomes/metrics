// Store em memória para progresso de sincronização
interface SyncProgress {
  publicationId: string;
  type: "posts" | "stats";
  status: "running" | "completed" | "error";
  current: number;
  total: number;
  percentage: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

class SyncProgressStore {
  private store: Map<string, SyncProgress> = new Map();

  getKey(publicationId: string, type: "posts" | "stats"): string {
    return `${publicationId}-${type}`;
  }

  start(publicationId: string, type: "posts" | "stats", total: number) {
    const key = this.getKey(publicationId, type);
    const progress = {
      publicationId,
      type,
      status: "running" as const,
      current: 0,
      total,
      percentage: 0,
      message: type === "posts" ? "Sincronizando posts..." : "Sincronizando estatísticas...",
      startedAt: new Date(),
    };
    this.store.set(key, progress);
    console.log(`🚀 [SyncStore] START ${type}:`, { key, total });
  }

  update(publicationId: string, type: "posts" | "stats", current: number, message?: string) {
    const key = this.getKey(publicationId, type);
    const progress = this.store.get(key);
    
    if (!progress) {
      console.warn(`⚠️ [SyncStore] UPDATE ${type}: Progresso não encontrado!`);
      return;
    }

    progress.current = current;
    progress.percentage = Math.round((current / progress.total) * 100);
    
    if (message) {
      progress.message = message;
    }
    
    this.store.set(key, progress);
    console.log(`📈 [SyncStore] UPDATE ${type}:`, { current, total: progress.total, percentage: progress.percentage });
  }

  complete(publicationId: string, type: "posts" | "stats", message: string) {
    const key = this.getKey(publicationId, type);
    const progress = this.store.get(key);
    
    if (!progress) {
      console.warn(`⚠️ [SyncStore] COMPLETE ${type}: Progresso não encontrado!`);
      return;
    }

    progress.status = "completed";
    progress.percentage = 100;
    progress.message = message;
    progress.completedAt = new Date();
    
    this.store.set(key, progress);
    console.log(`✅ [SyncStore] COMPLETE ${type}:`, { message });

    // Limpar após 5 minutos
    setTimeout(() => {
      this.store.delete(key);
      console.log(`🗑️ [SyncStore] CLEARED ${type}`);
    }, 5 * 60 * 1000);
  }

  error(publicationId: string, type: "posts" | "stats", error: string) {
    const key = this.getKey(publicationId, type);
    const progress = this.store.get(key);
    
    if (!progress) return;

    progress.status = "error";
    progress.error = error;
    progress.completedAt = new Date();
    
    this.store.set(key, progress);

    // Limpar após 5 minutos
    setTimeout(() => {
      this.store.delete(key);
    }, 5 * 60 * 1000);
  }

  get(publicationId: string, type: "posts" | "stats"): SyncProgress | null {
    const key = this.getKey(publicationId, type);
    return this.store.get(key) || null;
  }

  getAll(publicationId: string): { posts: SyncProgress | null; stats: SyncProgress | null } {
    return {
      posts: this.get(publicationId, "posts"),
      stats: this.get(publicationId, "stats"),
    };
  }

  clear(publicationId: string, type?: "posts" | "stats") {
    if (type) {
      const key = this.getKey(publicationId, type);
      this.store.delete(key);
    } else {
      this.store.delete(this.getKey(publicationId, "posts"));
      this.store.delete(this.getKey(publicationId, "stats"));
    }
  }
}

// Singleton instance
export const syncProgressStore = new SyncProgressStore();

