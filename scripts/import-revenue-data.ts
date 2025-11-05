import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pixelPool = new Pool({
  host: "24.144.88.69",
  port: 5432,
  database: "waffle_metrics",
  user: "waffle",
  password: "waffle_secure_password_2024",
});

// Função para parsear valores em reais (R$ 1.000,00 -> 1000.00)
function parseRevenueValue(value: string): number | null {
  if (!value || value === "" || value === "R$ 0.00") return null;
  
  // Remove "R$", espaços e pontos (separador de milhar)
  const cleaned = value.replace(/R\$\s*/g, "").replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

// Função para parsear número com separador de milhar (434,784 -> 434784)
function parseNumberValue(value: string): number | null {
  if (!value || value === "") return null;
  
  const cleaned = value.replace(/"/g, "").replace(/,/g, "");
  const parsed = parseInt(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

// Função para parsear data no formato DD/MM/YYYY
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === "") return null;
  
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts;
  // Retornar no formato YYYY-MM-DD para PostgreSQL
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function importRevenueData() {
  try {
    console.log("📥 Iniciando importação dos dados de receita...\n");

    // Ler o arquivo CSV
    const csvPath = path.join(process.cwd(), "Revenue.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    console.log(`📄 Arquivo lido: ${lines.length} linhas\n`);

    // Pular a primeira linha (cabeçalho)
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Split respeitando vírgulas dentro de aspas
        const columns = line.split(",");
        
        // Extrair valores (ajustar índices conforme estrutura do CSV)
        const nightDate = parseDate(columns[1]);
        const nightOpens = parseNumberValue(columns[2]);
        const morningDate = parseDate(columns[4]);
        const morningOpens = parseNumberValue(columns[5]);
        const adDate = parseDate(columns[7]);
        const morningRevenue = parseRevenueValue(columns[8]);
        const nightRevenue = parseRevenueValue(columns[9]);

        // Só inserir se houver pelo menos uma data de anúncio
        if (!adDate) {
          skipped++;
          continue;
        }

        // Verificar se já existe registro para esta data
        const existingCheck = await pixelPool.query(
          "SELECT id FROM revenue_data WHERE ad_date = $1",
          [adDate]
        );

        if (existingCheck.rows.length > 0) {
          // Atualizar registro existente
          await pixelPool.query(
            `UPDATE revenue_data 
             SET morning_date = $2, 
                 morning_unique_opens = $3, 
                 morning_revenue = $4,
                 night_date = $5,
                 night_unique_opens = $6,
                 night_revenue = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE ad_date = $1`,
            [adDate, morningDate, morningOpens, morningRevenue, nightDate, nightOpens, nightRevenue]
          );
        } else {
          // Inserir novo registro
          await pixelPool.query(
            `INSERT INTO revenue_data 
             (ad_date, morning_date, morning_unique_opens, morning_revenue, 
              night_date, night_unique_opens, night_revenue)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [adDate, morningDate, morningOpens, morningRevenue, nightDate, nightOpens, nightRevenue]
          );
        }

        imported++;

        // Log de progresso a cada 100 registros
        if (imported % 100 === 0) {
          console.log(`✅ Importados: ${imported} registros...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Erro na linha ${i + 1}:`, error);
      }
    }

    console.log("\n📊 Resumo da importação:");
    console.log(`  ✅ Importados: ${imported}`);
    console.log(`  ⏭️  Ignorados: ${skipped}`);
    console.log(`  ❌ Erros: ${errors}`);

    // Estatísticas básicas
    const stats = await pixelPool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(morning_revenue) as morning_ads,
        COUNT(night_revenue) as night_ads,
        SUM(COALESCE(morning_revenue, 0) + COALESCE(night_revenue, 0)) as total_revenue,
        MIN(ad_date) as first_date,
        MAX(ad_date) as last_date
      FROM revenue_data
    `);

    console.log("\n💰 Estatísticas dos dados importados:");
    console.log(`  Total de registros: ${stats.rows[0].total_records}`);
    console.log(`  Anúncios manhã: ${stats.rows[0].morning_ads}`);
    console.log(`  Anúncios noite: ${stats.rows[0].night_ads}`);
    console.log(`  Receita total: R$ ${parseFloat(stats.rows[0].total_revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`  Período: ${stats.rows[0].first_date} a ${stats.rows[0].last_date}`);

    console.log("\n✅ Importação concluída!");
    await pixelPool.end();
  } catch (error) {
    console.error("\n❌ Erro fatal:", error);
    await pixelPool.end();
    process.exit(1);
  }
}

importRevenueData();

