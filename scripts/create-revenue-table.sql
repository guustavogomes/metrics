-- Criar tabela para armazenar dados de receita de anúncios
CREATE TABLE IF NOT EXISTS revenue_data (
    id SERIAL PRIMARY KEY,
    ad_date DATE NOT NULL,
    morning_date DATE,
    morning_unique_opens INTEGER,
    morning_revenue DECIMAL(10, 2),
    night_date DATE,
    night_unique_opens INTEGER,
    night_revenue DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_revenue_ad_date ON revenue_data(ad_date);
CREATE INDEX IF NOT EXISTS idx_revenue_morning_date ON revenue_data(morning_date);
CREATE INDEX IF NOT EXISTS idx_revenue_night_date ON revenue_data(night_date);

-- View para facilitar queries de RPM
CREATE OR REPLACE VIEW revenue_metrics AS
SELECT 
    ad_date,
    morning_date,
    morning_unique_opens,
    morning_revenue,
    night_date,
    night_unique_opens,
    night_revenue,
    -- RPM (Revenue Per Mille) - Receita por 1.000 opens
    CASE 
        WHEN morning_unique_opens > 0 
        THEN ROUND((morning_revenue / morning_unique_opens * 1000)::numeric, 2)
        ELSE 0 
    END as morning_rpm,
    CASE 
        WHEN night_unique_opens > 0 
        THEN ROUND((night_revenue / night_unique_opens * 1000)::numeric, 2)
        ELSE 0 
    END as night_rpm,
    -- Receita total do dia
    COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0) as total_daily_revenue
FROM revenue_data
WHERE morning_revenue IS NOT NULL OR night_revenue IS NOT NULL;

COMMENT ON TABLE revenue_data IS 'Dados de receita de anúncios por edição (manhã/noite)';
COMMENT ON VIEW revenue_metrics IS 'View com métricas calculadas de RPM e receita total';

