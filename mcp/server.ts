import { App } from "@slack/bolt";
import dotenv from "dotenv";
import path from "path";
import { PixelAnalyticsService } from "./services/pixel-analytics-service";
import {
  formatPixelStats,
  formatOverlapRevenue,
  formatRevenueStats,
  formatComparisonData,
  formatWeekdayData,
  formatDailyData,
  formatWeeklyEditions,
  formatWeeklyDistribution,
  formatError,
  formatHelp,
} from "./utils/slack-formatter";

// Carregar variáveis de ambiente da pasta mcp/
// Tenta primeiro na pasta mcp/, depois na raiz do projeto
const envPath = path.join(process.cwd(), "mcp", ".env");
dotenv.config({ path: envPath });
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config(); // Tenta também no diretório atual

// Verificar se as variáveis essenciais estão carregadas
if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  console.error("❌ Erro: Variáveis de ambiente não encontradas!");
  console.error(`📁 Procurando .env em: ${envPath}`);
  console.error("💡 Certifique-se de que o arquivo .env existe em mcp/.env com:");
  console.error("   - SLACK_BOT_TOKEN");
  console.error("   - SLACK_APP_TOKEN");
  console.error("   - SLACK_SIGNING_SECRET");
  process.exit(1);
}

// Inicializar app do Slack
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
});

// Serviço de análise
const analyticsService = new PixelAnalyticsService();

/**
 * Handler para comando /pixel
 */
app.command("/pixel", async ({ command, ack, respond }) => {
  await ack();

  try {
    const parts = command.text.trim().split(/\s+/);
    const action = parts[0]?.toLowerCase() || "";
    const param1 = parts[1];
    const param2 = parts[2];

    // Se não há action, mostrar help
    if (!action || action === "help" || action === "ajuda") {
      await respond({ blocks: formatHelp() });
      return;
    }

    let blocks;

    switch (action) {
      case "stats":
      case "estatisticas":
      case "estatísticas":
        const statsDays = param1 ? parseInt(param1) : 30;
        if (param1 && (isNaN(statsDays) || statsDays < 1 || statsDays > 365)) {
          await respond({
            blocks: formatError("Número de dias inválido. Use um valor entre 1 e 365."),
          });
          return;
        }
        console.log(`📊 Buscando stats (${statsDays} dias)...`);
        const stats = await analyticsService.getStats(statsDays);
        blocks = formatPixelStats(stats, statsDays);
        break;

      case "overlap":
      case "sobreposicao":
      case "sobreposição":
        const overlapDays = param1 ? parseInt(param1) : 30;
        if (param1 && (isNaN(overlapDays) || overlapDays < 1 || overlapDays > 365)) {
          await respond({
            blocks: formatError("Número de dias inválido. Use um valor entre 1 e 365."),
          });
          return;
        }
        console.log(`📊 Buscando overlap (${overlapDays} dias)...`);
        const overlap = await analyticsService.getOverlapRevenue(overlapDays);
        blocks = formatOverlapRevenue(overlap);
        break;

      case "revenue":
      case "receita":
      case "monetizacao":
      case "monetização":
        const revenueDays = param1 ? parseInt(param1) : 30;
        if (param1 && (isNaN(revenueDays) || revenueDays < 1 || revenueDays > 365)) {
          await respond({
            blocks: formatError("Número de dias inválido. Use um valor entre 1 e 365."),
          });
          return;
        }
        console.log(`💰 Buscando receita (${revenueDays} dias)...`);
        const revenue = await analyticsService.getRevenueStats(revenueDays);
        blocks = formatRevenueStats(revenue);
        break;

      case "comparison":
      case "comparacao":
      case "comparação":
      case "impacto":
        console.log(`📊 Buscando dados de comparação...`);
        const comparison = await analyticsService.getComparisonData();
        blocks = formatComparisonData(comparison);
        break;

      case "weekday":
      case "semana":
      case "dia-semana":
        const weekdayDays = param1 ? parseInt(param1) : 30;
        if (param1 && (isNaN(weekdayDays) || weekdayDays < 1 || weekdayDays > 365)) {
          await respond({
            blocks: formatError("Número de dias inválido. Use um valor entre 1 e 365."),
          });
          return;
        }
        console.log(`📅 Buscando dados por dia da semana (${weekdayDays} dias)...`);
        const weekday = await analyticsService.getWeekdayData(weekdayDays);
        blocks = formatWeekdayData(weekday, weekdayDays);
        break;

      case "daily":
      case "diario":
      case "diário":
      case "evolucao":
      case "evolução":
        const dailyDays = param1 ? parseInt(param1) : 7;
        if (param1 && (isNaN(dailyDays) || dailyDays < 1 || dailyDays > 30)) {
          await respond({
            blocks: formatError("Número de dias inválido. Use um valor entre 1 e 30."),
          });
          return;
        }
        console.log(`📈 Buscando evolução diária (${dailyDays} dias)...`);
        const daily = await analyticsService.getDailyData(dailyDays);
        blocks = formatDailyData(daily, dailyDays);
        break;

      case "weekly":
      case "weekly7":
      case "weekly-7":
      case "7edicoes":
      case "7edições":
      case "7editions":
      case "6edicoes":
      case "6edições":
      case "5edicoes":
      case "5edições":
        let editionsFilter = "7"; // padrão: exatamente 7
        let weeks = 4; // padrão
        
        // Detectar filtro pelo nome do comando primeiro
        if (action.includes("7")) editionsFilter = "7";
        else if (action.includes("6")) editionsFilter = "6";
        else if (action.includes("5")) editionsFilter = "5";
        
        // Parsear parâmetros do texto do comando
        // Formato esperado: [filtro] [semanas]
        // Filtro pode ser: 7, 4+, -3, etc.
        if (param1) {
          // Verificar se é um filtro (contém + ou - ou é número)
          if (param1.includes("+") || param1.startsWith("-") || (!isNaN(parseInt(param1)) && parseInt(param1) >= 1 && parseInt(param1) <= 7)) {
            // É um filtro de edições
            editionsFilter = param1;
            // Verificar se há segundo parâmetro para semanas
            if (param2) {
              const num2 = parseInt(param2);
              if (!isNaN(num2) && num2 >= 1 && num2 <= 52) {
                weeks = num2;
              }
            }
          } else {
            // Pode ser número de semanas se não for filtro válido
            const num1 = parseInt(param1);
            if (!isNaN(num1) && num1 >= 1 && num1 <= 52) {
              weeks = num1;
            }
          }
        }
        
        // Validar filtro
        let isValidFilter = false;
        if (editionsFilter.includes("+")) {
          const num = parseInt(editionsFilter.replace("+", ""));
          isValidFilter = !isNaN(num) && num >= 1 && num <= 7;
        } else if (editionsFilter.startsWith("-")) {
          const num = parseInt(editionsFilter.replace("-", ""));
          isValidFilter = !isNaN(num) && num >= 1 && num <= 7;
        } else {
          const num = parseInt(editionsFilter);
          isValidFilter = !isNaN(num) && num >= 1 && num <= 7;
        }
        
        if (!isValidFilter) {
          await respond({
            blocks: formatError("Filtro de edições inválido. Use formato: 7 (exato), 4+ (ou mais), -3 (menos de). Número deve estar entre 1 e 7."),
          });
          return;
        }
        
        if (weeks < 1 || weeks > 52) {
          await respond({
            blocks: formatError("Número de semanas inválido. Use um valor entre 1 e 52."),
          });
          return;
        }
        
        console.log(`📊 Buscando taxa de ${editionsFilter} edições (${weeks} semanas)...`);
        const weekly = await analyticsService.getWeeklyEditionsRate(editionsFilter, weeks);
        blocks = formatWeeklyEditions(weekly);
        break;

      case "distribution":
      case "distribuicao":
      case "distribuição":
      case "dist":
        console.log(`📊 Buscando distribuição de edições semanais...`);
        const distribution = await analyticsService.getWeeklyEditionsDistribution(2);
        blocks = formatWeeklyDistribution(distribution);
        break;

      default:
        blocks = formatError(
          `Comando desconhecido: "${action}". Use \`/pixel help\` para ver os comandos disponíveis.`
        );
    }

    await respond({ blocks });
  } catch (error) {
    console.error("❌ Erro ao processar comando:", error);
    await respond({
      blocks: formatError(
        `Erro ao processar comando: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      ),
    });
  }
});

/**
 * Handler para mensagens diretas (DM) - apenas quando o bot é mencionado
 */
app.event("app_mention", async ({ event, say }) => {
  try {
    const text = event.text?.toLowerCase() || "";

    // Tentar extrair número de dias
    const daysMatch = text.match(/(\d+)\s*(dias|days)?/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 30;

      // Determinar ação baseado nas palavras-chave
      let action = "stats";
      if (text.includes("overlap") || text.includes("sobreposição")) {
        action = "overlap";
      } else if (
        text.includes("receita") ||
        text.includes("revenue") ||
        text.includes("monetização")
      ) {
        action = "revenue";
      } else if (text.includes("comparison") || text.includes("comparação") || text.includes("impacto")) {
        action = "comparison";
      } else if (text.includes("weekday") || text.includes("semana") || text.includes("dia da semana")) {
        action = "weekday";
      } else if (text.includes("daily") || text.includes("diário") || text.includes("evolução")) {
        action = "daily";
      } else if (text.includes("weekly") || text.includes("edições") || text.includes("edicoes") || text.includes("editions")) {
        action = "weekly";
        // Detectar número de edições no texto
        if (text.includes("7") || text.includes("sete")) {
          // editions = 7 (padrão)
        } else if (text.includes("6") || text.includes("seis")) {
          // editions = 6
        } else if (text.includes("5") || text.includes("cinco")) {
          // editions = 5
        }
      } else if (text.includes("help") || text.includes("ajuda")) {
        action = "help";
      }

    let blocks;

      switch (action) {
        case "stats":
          const stats = await analyticsService.getStats(days);
          blocks = formatPixelStats(stats, days);
          break;
        case "overlap":
          const overlap = await analyticsService.getOverlapRevenue(days);
          blocks = formatOverlapRevenue(overlap);
          break;
        case "revenue":
          const revenue = await analyticsService.getRevenueStats(days);
          blocks = formatRevenueStats(revenue);
          break;
        case "comparison":
          const comparison = await analyticsService.getComparisonData();
          blocks = formatComparisonData(comparison);
          break;
        case "weekday":
          const weekday = await analyticsService.getWeekdayData(days);
          blocks = formatWeekdayData(weekday, days);
          break;
        case "daily":
          const daily = await analyticsService.getDailyData(days);
          blocks = formatDailyData(daily, days);
          break;
        case "weekly":
          // Tentar extrair filtro e semanas do texto
          // Filtro pode ser: 7, 4+, -3, etc.
          const filterMatch = text.match(/(-?[1-7]\+?|\d+\+)/);
          const weeksMatch = text.match(/(\d+)\s*(semanas|weeks)?/);
          
          let editionsFilterForMention = "7"; // padrão
          if (filterMatch) {
            const match = filterMatch[1];
            // Validar se é um filtro válido
            if (match.includes("+") || match.startsWith("-") || (parseInt(match) >= 1 && parseInt(match) <= 7)) {
              editionsFilterForMention = match;
            }
          }
          
          const weeksForMention = weeksMatch ? parseInt(weeksMatch[1]) : 4;
          const weeklyMention = await analyticsService.getWeeklyEditionsRate(editionsFilterForMention, weeksForMention);
          blocks = formatWeeklyEditions(weeklyMention);
          break;
        default:
          blocks = formatHelp();
      }

    await say({ blocks });
  } catch (error) {
    console.error("❌ Erro ao processar menção:", error);
    await say({
      blocks: formatError(
        `Erro ao processar: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      ),
    });
  }
});

/**
 * Handler para eventos de interação
 */
app.action("button_click", async ({ body, ack, respond }) => {
  await ack();
  // Implementar ações de botões se necessário
});

/**
 * Iniciar servidor
 */
(async () => {
  try {
    await app.start();
    console.log("🚀 Servidor MCP Slack iniciado!");
    console.log(`📡 Escutando na porta ${process.env.PORT || 3000}`);
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
})();

/**
 * Graceful shutdown
 */
process.on("SIGTERM", async () => {
  console.log("🛑 Encerrando servidor...");
  await analyticsService.close();
  await app.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Encerrando servidor...");
  await analyticsService.close();
  await app.stop();
  process.exit(0);
});

