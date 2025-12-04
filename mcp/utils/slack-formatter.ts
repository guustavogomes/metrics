// Usando any para blocos do Slack devido a incompatibilidade de tipos
type SlackBlock = any;

// Importar tipo UTM do serviço
interface UtmFilter {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_channel?: string;
}

/**
 * Gera descrição do filtro UTM para exibição nos headers
 */
function getUtmFilterLabel(filter?: UtmFilter): string {
  if (!filter) return "";

  const parts: string[] = [];
  if (filter.utm_medium) parts.push(`canal: ${filter.utm_medium}`);
  if (filter.utm_source) parts.push(`fonte: ${filter.utm_source}`);
  if (filter.utm_campaign) parts.push(`campanha: ${filter.utm_campaign}`);

  return parts.length > 0 ? ` | ${parts.join(", ")}` : "";
}

/**
 * Formata números com separadores de milhar
 */
function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formata valores monetários
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata porcentagem
 */
function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Cria blocos de mensagem para estatísticas do Pixel
 */
export function formatPixelStats(stats: any, days: number, utmFilter?: UtmFilter): SlackBlock[] {
  const filterLabel = getUtmFilterLabel(utmFilter);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Estatísticas do Pixel (${days} dias)${filterLabel}`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*🌅 Manhã*\n• Leitores únicos: *${formatNumber(
            stats.morning.uniqueReaders
          )}*\n• Média diária: *${formatNumber(stats.morning.average)}*`,
        },
        {
          type: "mrkdwn",
          text: `*🌙 Noite*\n• Leitores únicos: *${formatNumber(
            stats.night.uniqueReaders
          )}*\n• Média diária: *${formatNumber(stats.night.average)}*`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*📅 Domingo*\n• Leitores únicos: *${formatNumber(
            stats.sunday.uniqueReaders
          )}*\n• Média diária: *${formatNumber(stats.sunday.average)}*`,
        },
      ],
    },
  ];

  return blocks;
}

/**
 * Cria blocos de mensagem para overlap e receita
 */
export function formatOverlapRevenue(data: any, utmFilter?: UtmFilter): SlackBlock[] {
  const filterLabel = getUtmFilterLabel(utmFilter);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `💰 Overlap & Receita (${data.period} dias)${filterLabel}`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*👥 Leem AMBAS as edições*",
      },
      fields: [
        {
          type: "mrkdwn",
          text: `• Usuários: *${formatNumber(data.overlap.both.users)}*\n• ${formatPercent(
            data.overlap.both.percentageOfUsers
          )} do total`,
        },
        {
          type: "mrkdwn",
          text: `• Receita: *${formatCurrency(
            data.overlap.both.revenue
          )}*\n• LTV: *${formatCurrency(data.overlap.both.ltv)}*`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🌅 Apenas Manhã*",
      },
      fields: [
        {
          type: "mrkdwn",
          text: `• Usuários: *${formatNumber(
            data.overlap.morningOnly.users
          )}*\n• ${formatPercent(
            data.overlap.morningOnly.percentageOfUsers
          )} do total`,
        },
        {
          type: "mrkdwn",
          text: `• Receita: *${formatCurrency(
            data.overlap.morningOnly.revenue
          )}*\n• LTV: *${formatCurrency(data.overlap.morningOnly.ltv)}*`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🌙 Apenas Noite*",
      },
      fields: [
        {
          type: "mrkdwn",
          text: `• Usuários: *${formatNumber(
            data.overlap.nightOnly.users
          )}*\n• ${formatPercent(
            data.overlap.nightOnly.percentageOfUsers
          )} do total`,
        },
        {
          type: "mrkdwn",
          text: `• Receita: *${formatCurrency(
            data.overlap.nightOnly.revenue
          )}*\n• LTV: *${formatCurrency(data.overlap.nightOnly.ltv)}*`,
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*📊 Totais*\n• Usuários únicos: *${formatNumber(
            data.totals.totalUniqueUsers
          )}*\n• Total de aberturas: *${formatNumber(
            data.totals.totalOpens
          )}*`,
        },
        {
          type: "mrkdwn",
          text: `*💰 Receita*\n• Total: *${formatCurrency(
            data.totals.totalRevenue
          )}*\n• Por usuário: *${formatCurrency(
            data.totals.avgRevenuePerUser
          )}*`,
        },
      ],
    },
  ];

  return blocks;
}

/**
 * Cria blocos de mensagem para estatísticas de receita
 */
export function formatRevenueStats(data: any): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `💰 Receita & Monetização`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*💰 Receita Total*\n*${formatCurrency(data.stats.totalRevenue)}*`,
        },
        {
          type: "mrkdwn",
          text: `*📈 Taxa de Monetização*\n*${formatPercent(
            data.stats.monetizationRate
          )}*`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*🌅 Manhã*\n• Receita: *${formatCurrency(
            data.stats.morningRevenue
          )}*\n• RPM médio: *R$ ${formatNumber(data.stats.avgMorningRPM, 2)}*`,
        },
        {
          type: "mrkdwn",
          text: `*🌙 Noite*\n• Receita: *${formatCurrency(
            data.stats.nightRevenue
          )}*\n• RPM médio: *R$ ${formatNumber(data.stats.avgNightRPM, 2)}*`,
        },
      ],
    },
  ];

  // Adicionar últimos 7 dias se houver dados
  if (data.timeSeries && data.timeSeries.length > 0) {
    const last7Days = data.timeSeries.slice(-7);
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*📅 Últimos 7 dias*",
      },
    });

    const last7DaysText = last7Days
      .map((day: any) => {
        const date = new Date(day.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        return `${date}: ${formatCurrency(day.totalRevenue)}`;
      })
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: last7DaysText,
      },
    });
  }

  return blocks;
}

/**
 * Cria mensagem de erro
 */
export function formatError(message: string): SlackBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `❌ *Erro*\n${message}`,
      },
    },
  ];
}

/**
 * Cria blocos de mensagem para comparação antes/depois
 */
export function formatComparisonData(data: any): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📊 Comparação: Ago-Set vs Out+",
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🌅 Edição Manhã*",
      },
      fields: [
        {
          type: "mrkdwn",
          text: `*Ago-Set/2025*\n${formatNumber(data.morning.before.avgUniqueReaders)} leitores/dia\n(${formatNumber(data.morning.before.totalDays)} dias)`,
        },
        {
          type: "mrkdwn",
          text: `*Out/2025+*\n${formatNumber(data.morning.after.avgUniqueReaders)} leitores/dia\n(${formatNumber(data.morning.after.totalDays)} dias)`,
        },
        {
          type: "mrkdwn",
          text: `*Variação*\n${data.morning.change >= 0 ? "📈" : "📉"} ${formatPercent(Math.abs(data.morning.change))}\n${data.morning.change >= 0 ? "Crescimento" : "Queda"}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*🌙 Edição Noite*",
      },
      fields: [
        {
          type: "mrkdwn",
          text: `*Ago-Set/2025*\n${data.night.before.avgUniqueReaders > 0 ? formatNumber(data.night.before.avgUniqueReaders) + " leitores/dia" : "Dados insuficientes"}\n${data.night.before.totalDays > 0 ? `(${formatNumber(data.night.before.totalDays)} dias)` : ""}`,
        },
        {
          type: "mrkdwn",
          text: `*Out/2025+*\n${formatNumber(data.night.after.avgUniqueReaders)} leitores/dia\n(${formatNumber(data.night.after.totalDays)} dias)`,
        },
        {
          type: "mrkdwn",
          text: `*Variação*\n${data.night.change >= 0 ? "📈" : "📉"} ${formatPercent(Math.abs(data.night.change))}\n${data.night.change >= 0 ? "Crescimento" : "Queda"}`,
        },
      ],
    },
  ];

  // Adicionar insights
  const insight = data.morning.change < -5
    ? `⚠️ A edição manhã teve uma queda de ${formatPercent(Math.abs(data.morning.change))}, indicando possível migração de audiência.`
    : data.morning.change > 5
    ? `✅ A edição manhã cresceu ${formatPercent(data.morning.change)}, mostrando que as duas edições se complementam.`
    : `📊 A edição manhã manteve estabilidade (${formatPercent(Math.abs(data.morning.change))}), indicando que a edição noite atingiu um público diferente.`;

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*💡 Insight:*\n${insight}`,
    },
  });

  return blocks;
}

/**
 * Cria blocos de mensagem para dados por dia da semana
 */
export function formatWeekdayData(data: any[], days: number, utmFilter?: UtmFilter): SlackBlock[] {
  const filterLabel = getUtmFilterLabel(utmFilter);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📅 Aberturas por Dia da Semana (${days} dias)${filterLabel}`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
  ];

  // Agrupar em seções para melhor visualização
  const weekdays = data.filter((d) => d.day !== "Dom" || d.morning + d.night + d.sunday > 0);

  weekdays.forEach((dayData) => {
    const total = dayData.morning + dayData.night + dayData.sunday;
    if (total === 0) return;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${dayData.day}*`,
      },
      fields: [
        {
          type: "mrkdwn",
          text: `🌅 Manhã: *${formatNumber(dayData.morning)}*`,
        },
        {
          type: "mrkdwn",
          text: `🌙 Noite: *${formatNumber(dayData.night)}*`,
        },
        {
          type: "mrkdwn",
          text: `📅 Domingo: *${formatNumber(dayData.sunday)}*`,
        },
      ],
    });
  });

  // Encontrar melhor dia
  const bestDay = weekdays.reduce((best, current) => {
    const currentTotal = current.morning + current.night + current.sunday;
    const bestTotal = best.morning + best.night + best.sunday;
    return currentTotal > bestTotal ? current : best;
  }, weekdays[0]);

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*🏆 Melhor dia:* ${bestDay.day} com ${formatNumber(bestDay.morning + bestDay.night + bestDay.sunday)} leitores únicos`,
    },
  });

  return blocks;
}

/**
 * Cria blocos de mensagem para evolução diária
 */
export function formatDailyData(data: any[], days: number, utmFilter?: UtmFilter): SlackBlock[] {
  const filterLabel = getUtmFilterLabel(utmFilter);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📈 Evolução Diária (últimos ${days} dias)${filterLabel}`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
  ];

  // Mostrar últimos 7 dias ou todos se menos
  const recentDays = data.slice(-7);

  recentDays.forEach((dayData) => {
    const total = dayData.morning + dayData.night + dayData.sunday;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${dayData.date}* - Total: *${formatNumber(total)}* leitores`,
      },
      fields: [
        {
          type: "mrkdwn",
          text: `🌅 ${formatNumber(dayData.morning)}`,
        },
        {
          type: "mrkdwn",
          text: `🌙 ${formatNumber(dayData.night)}`,
        },
        {
          type: "mrkdwn",
          text: `📅 ${formatNumber(dayData.sunday)}`,
        },
      ],
    });
  });

  // Calcular tendência
  if (recentDays.length >= 2) {
    const first = recentDays[0];
    const last = recentDays[recentDays.length - 1];
    const firstTotal = first.morning + first.night + first.sunday;
    const lastTotal = last.morning + last.night + last.sunday;
    const trend = firstTotal > 0 ? ((lastTotal - firstTotal) / firstTotal) * 100 : 0;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📊 Tendência:* ${trend >= 0 ? "📈" : "📉"} ${formatPercent(Math.abs(trend))} ${trend >= 0 ? "de crescimento" : "de queda"} nos últimos dias`,
      },
    });
  }

  return blocks;
}

/**
 * Cria blocos de mensagem para taxa de N edições na semana
 */
export function formatWeeklyEditions(data: any[], utmFilter?: UtmFilter): SlackBlock[] {
  const filterDescription = data[0]?.filterDescription || "7 edições";
  const filterLabel = getUtmFilterLabel(utmFilter);
  
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Taxa de Usuários com ${filterDescription}${filterLabel}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Análise:* Porcentagem de usuários que abriram ${filterDescription} na semana (Segunda a Sábado)`,
      },
    },
    {
      type: "divider",
    },
  ];

  // Mostrar cada semana
  data.forEach((weekData) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Semana de ${weekData.week}*`,
      },
      fields: [
        {
          type: "mrkdwn",
          text: `*Total de usuários*\n${formatNumber(weekData.totalUsers)}`,
        },
        {
          type: "mrkdwn",
          text: `*Com ${filterDescription}*\n${formatNumber(weekData.usersWithNEditions)}`,
        },
        {
          type: "mrkdwn",
          text: `*Taxa*\n*${formatPercent(weekData.percentage)}*`,
        },
      ],
    });
  });

  // Calcular média se houver múltiplas semanas
  if (data.length > 1) {
    const avgPercentage =
      data.reduce((sum, w) => sum + w.percentage, 0) / data.length;
    const totalUsers = data.reduce((sum, w) => sum + w.totalUsers, 0);
    const totalWithN = data.reduce((sum, w) => sum + w.usersWithNEditions, 0);

    blocks.push({
      type: "divider",
    });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📈 Média Geral (${data.length} semanas)*`,
      },
      fields: [
        {
          type: "mrkdwn",
          text: `*Total de usuários*\n${formatNumber(totalUsers)}`,
        },
        {
          type: "mrkdwn",
          text: `*Com ${filterDescription}*\n${formatNumber(totalWithN)}`,
        },
        {
          type: "mrkdwn",
          text: `*Taxa média*\n*${formatPercent(avgPercentage)}*`,
        },
      ],
    });
  }

  // Adicionar insight
  const latestWeek = data[0];
  let insight = "";
  if (latestWeek.percentage >= 50) {
    insight = `✅ Excelente! ${formatPercent(latestWeek.percentage)} dos usuários abriram ${filterDescription} na semana, mostrando alta fidelidade.`;
  } else if (latestWeek.percentage >= 30) {
    insight = `📊 Bom engajamento! ${formatPercent(latestWeek.percentage)} dos usuários abriram ${filterDescription} na semana. Há espaço para crescimento.`;
  } else {
    insight = `⚠️ Apenas ${formatPercent(latestWeek.percentage)} dos usuários abriram ${filterDescription} na semana. Considere estratégias para aumentar a retenção.`;
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*💡 Insight:*\n${insight}`,
    },
  });

  return blocks;
}

/**
 * Cria blocos de mensagem para distribuição de edições semanais (0/7 a 7/7)
 */
export function formatWeeklyDistribution(data: {
  currentWeek: {
    weekStart: string;
    totalUsers: number;
    distribution: Array<{
      bucket: string;
      count: number;
      percentage: number;
    }>;
  };
  previousWeek: {
    weekStart: string;
    totalUsers: number;
    distribution: Array<{
      bucket: string;
      count: number;
      percentage: number;
    }>;
  } | null;
}, utmFilter?: UtmFilter): SlackBlock[] {
  const filterLabel = getUtmFilterLabel(utmFilter);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Distribuição de Edições Semanais${filterLabel}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Análise:* Distribuição de usuários por quantidade de edições abertas na semana (Seg-Sáb)`,
      },
    },
    {
      type: "divider",
    },
  ];

  // Semana atual
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*📅 Semana de ${data.currentWeek.weekStart}*\nBase total: *${formatNumber(data.currentWeek.totalUsers)}* usuários`,
    },
  });

  // Tabela de distribuição atual
  let distributionText = "```\n";
  distributionText += "Edições  |    %    |  Var.\n";
  distributionText += "---------|---------|-------\n";

  data.currentWeek.distribution.forEach((item, index) => {
    const currentPct = item.percentage.toFixed(2).padStart(5);
    let variation = "  -  ";

    if (data.previousWeek) {
      const prevItem = data.previousWeek.distribution[index];
      if (prevItem) {
        const diff = item.percentage - prevItem.percentage;
        if (diff > 0) {
          variation = `+${diff.toFixed(1)}`.padStart(5);
        } else if (diff < 0) {
          variation = `${diff.toFixed(1)}`.padStart(5);
        } else {
          variation = "  0  ";
        }
      }
    }

    distributionText += `  ${item.bucket}   | ${currentPct}%  | ${variation}\n`;
  });
  distributionText += "```";

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: distributionText,
    },
  });

  // Semana anterior (se disponível)
  if (data.previousWeek) {
    blocks.push({
      type: "divider",
    });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📅 Semana anterior (${data.previousWeek.weekStart})*\nBase total: *${formatNumber(data.previousWeek.totalUsers)}* usuários`,
      },
    });

    let prevDistributionText = "```\n";
    prevDistributionText += "Edições  |    %    \n";
    prevDistributionText += "---------|---------\n";

    data.previousWeek.distribution.forEach((item) => {
      const pct = item.percentage.toFixed(2).padStart(5);
      prevDistributionText += `  ${item.bucket}   | ${pct}%  \n`;
    });
    prevDistributionText += "```";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: prevDistributionText,
      },
    });

    // Variação da base
    const baseChange = ((data.currentWeek.totalUsers - data.previousWeek.totalUsers) / data.previousWeek.totalUsers * 100);
    const baseIcon = baseChange >= 0 ? "📈" : "📉";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${baseIcon} Variação da base:* ${baseChange >= 0 ? "+" : ""}${formatPercent(baseChange)} (${formatNumber(data.currentWeek.totalUsers - data.previousWeek.totalUsers)} usuários)`,
      },
    });
  }

  // Insights (índices: 0=1/7, 1=2/7, ..., 6=7/7)
  const current = data.currentWeek.distribution;
  const oneEdition = current[0]?.percentage || 0; // 1/7
  const fullEditions = current[6]?.percentage || 0; // 7/7
  const highEngagement = current.slice(3).reduce((sum, i) => sum + i.percentage, 0); // 4+ edições (índices 3-6 = 4/7 a 7/7)
  const lowEngagement = current.slice(0, 2).reduce((sum, i) => sum + i.percentage, 0); // 1-2 edições

  let insight = "";
  if (lowEngagement > 50) {
    insight = `⚠️ ${formatPercent(lowEngagement)} dos usuários abriram apenas 1-2 edições. Considere estratégias de engajamento.`;
  } else if (fullEditions > 10) {
    insight = `🌟 ${formatPercent(fullEditions)} abriram todas as 7 edições! Excelente fidelização.`;
  } else if (highEngagement > 30) {
    insight = `✅ ${formatPercent(highEngagement)} dos usuários abriram 4+ edições, mostrando bom engajamento.`;
  } else {
    insight = `📊 Distribuição equilibrada entre os níveis de engajamento.`;
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*💡 Insight:*\n${insight}`,
    },
  });

  return blocks;
}

/**
 * Cria blocos de mensagem para lista de canais UTM disponíveis
 */
export function formatUtmValues(data: {
  utm_medium: Array<{ value: string; count: number }>;
  utm_source: Array<{ value: string; count: number }>;
}): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📡 Canais UTM Disponíveis",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Use estes valores para filtrar os dados por canal de entrada*\nFormato: `canal:valor` ou `fonte:valor`",
      },
    },
    {
      type: "divider",
    },
  ];

  // UTM Medium (Canal)
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*🔗 Canais (utm_medium):*",
    },
  });

  const mediumList = data.utm_medium
    .map((item) => `• \`${item.value}\` (${formatNumber(item.count)} leitores)`)
    .join("\n");

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: mediumList || "Nenhum canal encontrado",
    },
  });

  // UTM Source (Fonte)
  blocks.push({
    type: "divider",
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📍 Fontes (utm_source):*",
    },
  });

  const sourceList = data.utm_source
    .map((item) => `• \`${item.value}\` (${formatNumber(item.count)} leitores)`)
    .join("\n");

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: sourceList || "Nenhuma fonte encontrada",
    },
  });

  // Exemplos
  blocks.push({
    type: "divider",
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*💡 Exemplos de uso:*\n• `/pixel stats 30 canal:socialpaid` - Stats apenas de tráfego pago\n• `/pixel stats 30 fonte:meta` - Stats apenas de Meta Ads\n• `/pixel weekly 7 canal:instagrambio` - Taxa 7/7 de Instagram bio\n• `/pixel overlap 30 canal:newsletter` - Overlap de assinantes de newsletter",
    },
  });

  return blocks;
}

/**
 * Cria mensagem de ajuda
 */
export function formatHelp(): SlackBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📚 Comandos Disponíveis",
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Comandos básicos:*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "`/pixel stats [dias]` - Estatísticas gerais do Pixel\n`/pixel overlap [dias]` - Análise de overlap e receita\n`/pixel revenue [dias]` - Estatísticas de receita\n`/pixel comparison` - Comparação Ago-Set vs Out+\n`/pixel weekday [dias]` - Análise por dia da semana\n`/pixel daily [dias]` - Evolução diária resumida\n`/pixel weekly [filtro] [semanas]` - % usuários com filtro de edições\n`/pixel distribuicao` - Distribuição completa 1/7 a 7/7\n`/pixel canais` - Lista canais UTM disponíveis\n`/pixel help` - Mostra esta ajuda",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Filtro por canal UTM:*\nAdicione `canal:valor` ou `fonte:valor` a qualquer comando\n• `/pixel stats 30 canal:socialpaid` - Stats de tráfego pago\n• `/pixel stats 30 fonte:meta` - Stats de Meta Ads\n• `/pixel weekly 7 canal:instagrambio` - Taxa 7/7 do Instagram\n• `/pixel canais` - Ver todos os canais disponíveis",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Exemplos gerais:*\n• `/pixel stats 30` - Stats dos últimos 30 dias\n• `/pixel overlap 90` - Overlap dos últimos 90 dias\n• `/pixel weekly 7` - Taxa de exatamente 7 edições\n• `/pixel weekly 4+` - Taxa de 4 ou mais edições\n• `/pixel weekly -3` - Taxa de menos de 3 edições",
      },
    },
  ];
}

