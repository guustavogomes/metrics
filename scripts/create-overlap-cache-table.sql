-- Conecta ao banco de dados waffle_metrics
\c waffle_metrics;

-- Cria a tabela de cache de overlap se não existir
CREATE TABLE IF NOT EXISTS pixel_overlap_cache (
    id SERIAL PRIMARY KEY,
    period_days INTEGER NOT NULL UNIQUE,
    morning_unique INTEGER NOT NULL,
    night_unique INTEGER NOT NULL,
    overlap_count INTEGER NOT NULL,
    overlap_pct_morning NUMERIC(5, 2),
    overlap_pct_night NUMERIC(5, 2),
    morning_only_count INTEGER NOT NULL,
    night_only_count INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria índice para otimização
CREATE INDEX IF NOT EXISTS idx_pixel_overlap_cache_period_days ON pixel_overlap_cache (period_days);

-- Comentário da tabela
COMMENT ON TABLE pixel_overlap_cache IS 'Cache pré-calculado de sobreposição de leitores entre edições manhã e noite por período';

