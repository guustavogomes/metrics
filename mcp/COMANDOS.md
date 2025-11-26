# 📚 Guia Completo de Comandos - Pixel Analytics Bot

Este documento contém todos os comandos disponíveis no bot do Slack para análise de métricas do Pixel.

---

## 📋 Índice

1. [Comandos Básicos](#comandos-básicos)
2. [Comandos Avançados](#comandos-avançados)
3. [Exemplos de Uso](#exemplos-de-uso)
4. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## 🎯 Comandos Básicos

### `/pixel stats [dias]`

**Descrição:** Estatísticas gerais de leitores únicos por edição.

**Parâmetros:**
- `dias` (opcional): Número de dias a analisar (padrão: 30, máximo: 365)

**Retorna:**
- Leitores únicos da Edição Manhã
- Leitores únicos da Edição Noite
- Leitores únicos da Edição Domingo
- Média diária de leitores por edição

**Exemplos:**
```
/pixel stats
/pixel stats 30
/pixel stats 90
```

**Quando usar:**
- Visão geral rápida das métricas
- Comparação entre edições
- Verificar tendências gerais

---

### `/pixel overlap [dias]`

**Descrição:** Análise detalhada de sobreposição de leitores entre edições e métricas de receita.

**Parâmetros:**
- `dias` (opcional): Número de dias a analisar (padrão: 30)

**Retorna:**
- Leitores que leem AMBAS as edições
- Leitores que leem APENAS Manhã
- Leitores que leem APENAS Noite
- Receita e LTV por grupo
- Receita por abertura
- Percentual de cada grupo

**Exemplos:**
```
/pixel overlap
/pixel overlap 30
/pixel overlap 90
```

**Quando usar:**
- Analisar fidelidade da audiência
- Entender comportamento dos leitores
- Calcular valor de diferentes segmentos
- Planejar estratégias de engajamento

---

### `/pixel revenue [dias]`

**Descrição:** Estatísticas de monetização e receita.

**Parâmetros:**
- `dias` (opcional): Número de dias a analisar (padrão: 30)

**Retorna:**
- Receita total (Manhã + Noite)
- Receita por edição
- RPM médio (Receita por Mil)
- Taxa de monetização
- Série temporal dos últimos 7 dias

**Exemplos:**
```
/pixel revenue
/pixel revenue 30
/pixel revenue 7
```

**Quando usar:**
- Acompanhar performance financeira
- Comparar RPM entre edições
- Verificar eficiência de monetização
- Análise de receita diária

---

## 🚀 Comandos Avançados

### `/pixel comparison`

**Descrição:** Comparação de performance antes e depois do lançamento da Edição Noite (Ago-Set vs Out+).

**Parâmetros:**
- Nenhum (usa período fixo)

**Retorna:**
- Média de leitores/dia no período Ago-Set/2025
- Média de leitores/dia no período Out/2025+
- Variação percentual para cada edição
- Insights sobre migração de audiência

**Exemplos:**
```
/pixel comparison
/pixel comparacao
/pixel impacto
```

**Quando usar:**
- Avaliar impacto do lançamento da Edição Noite
- Identificar migração de audiência
- Verificar se as edições se complementam
- Análise de tendências de longo prazo

---

### `/pixel weekday [dias]`

**Descrição:** Análise de leitores únicos por dia da semana.

**Parâmetros:**
- `dias` (opcional): Número de dias a analisar (padrão: 30)

**Retorna:**
- Leitores únicos por dia da semana (Dom, Seg, Ter, Qua, Qui, Sex, Sáb)
- Distribuição entre edições em cada dia
- Identificação do melhor dia da semana

**Exemplos:**
```
/pixel weekday
/pixel weekday 30
/pixel weekday 90
/pixel semana 60
```

**Quando usar:**
- Identificar padrões semanais
- Descobrir melhores dias para publicação
- Otimizar estratégia de distribuição
- Entender comportamento do leitor

---

### `/pixel daily [dias]`

**Descrição:** Evolução diária resumida dos últimos dias.

**Parâmetros:**
- `dias` (opcional): Número de dias a mostrar (padrão: 7, máximo: 30)

**Retorna:**
- Leitores únicos dia a dia
- Distribuição por edição em cada dia
- Tendência geral (crescimento/queda)
- Últimos 7 dias ou período especificado

**Exemplos:**
```
/pixel daily
/pixel daily 7
/pixel daily 14
/pixel evolucao 10
```

**Quando usar:**
- Acompanhamento diário
- Identificar picos e quedas
- Verificar tendências recentes
- Análise de curto prazo

---

## 📖 Ajuda

### `/pixel help`

**Descrição:** Mostra todos os comandos disponíveis e exemplos de uso.

**Exemplos:**
```
/pixel help
/pixel ajuda
```

---

## 💡 Exemplos de Uso

### Análise Semanal Típica

```
Segunda-feira:
/pixel stats 7          # Ver performance da semana passada
/pixel weekday 30       # Ver padrão semanal
/pixel revenue 7        # Ver receita da semana

Quarta-feira:
/pixel daily 7          # Acompanhar evolução da semana atual
/pixel overlap 30       # Verificar fidelidade dos leitores

Sexta-feira:
/pixel comparison       # Avaliar impacto de longo prazo
/pixel stats 30         # Resumo mensal
```

### Análise Mensal

```
/pixel stats 30         # Visão geral do mês
/pixel overlap 30       # Análise de sobreposição
/pixel revenue 30       # Receita mensal
/pixel weekday 30       # Padrões semanais
```

### Análise Trimestral

```
/pixel stats 90         # Visão geral do trimestre
/pixel overlap 90       # Análise de sobreposição ampla
/pixel comparison       # Impacto de longo prazo
/pixel weekday 90       # Padrões semanais consolidados
```

---

## 🎨 Dicas e Boas Práticas

### 1. **Comece com Stats**
Sempre comece com `/pixel stats` para ter uma visão geral antes de análises mais profundas.

### 2. **Use Períodos Apropriados**
- **7 dias**: Análise semanal rápida
- **30 dias**: Análise mensal padrão
- **90 dias**: Análise trimestral
- **365 dias**: Análise anual (use com cuidado, pode ser lento)

### 3. **Combine Comandos**
Combine diferentes comandos para análises completas:
```
/pixel stats 30         # Visão geral
/pixel overlap 30       # Detalhes de sobreposição
/pixel revenue 30       # Performance financeira
```

### 4. **Monitore Tendências**
Use `/pixel daily` regularmente para identificar tendências e anomalias rapidamente.

### 5. **Análise de Impacto**
Use `/pixel comparison` periodicamente para avaliar o impacto de mudanças estratégicas.

### 6. **Padrões Semanais**
Use `/pixel weekday` para identificar os melhores dias para publicações e campanhas.

---

## 📊 Interpretação dos Resultados

### **Estatísticas de Overlap**

- **Leem AMBAS**: Alta fidelidade, maior valor
- **Apenas Manhã**: Público específico da manhã
- **Apenas Noite**: Público específico da noite

**Meta ideal:** 30-50% leem ambas as edições

### **Comparação Antes/Depois**

- **Crescimento positivo**: Edições se complementam
- **Crescimento negativo**: Possível migração de audiência
- **Estabilidade**: Públicos distintos

### **Dia da Semana**

- Identifique o melhor dia
- Use para otimizar timing de publicações
- Ajuste estratégias por dia da semana

### **Evolução Diária**

- **Tendência ascendente**: Crescimento saudável
- **Tendência descendente**: Investigar causas
- **Estabilidade**: Público consolidado

---

## ⚠️ Limitações e Observações

1. **Período máximo**: 365 dias (1 ano)
2. **Período mínimo**: 1 dia
3. **Performance**: Análises de 90+ dias podem levar alguns segundos
4. **Dados**: Baseados em cache otimizado, atualizado semanalmente
5. **Comparação**: `/pixel comparison` usa períodos fixos (não aceita parâmetros)

---

## 🔄 Comandos Alternativos (Aliases)

Alguns comandos aceitam variações em português:

| Comando Principal | Aliases Aceitos |
|------------------|-----------------|
| `stats` | `estatisticas`, `estatísticas` |
| `overlap` | `sobreposicao`, `sobreposição` |
| `revenue` | `receita`, `monetizacao`, `monetização` |
| `comparison` | `comparacao`, `comparação`, `impacto` |
| `weekday` | `semana`, `dia-semana` |
| `daily` | `diario`, `diário`, `evolucao`, `evolução` |
| `help` | `ajuda` |

---

## 📞 Suporte

Se encontrar algum problema ou tiver dúvidas:

1. Use `/pixel help` para ver todos os comandos
2. Verifique se o formato do comando está correto
3. Certifique-se de que o período está entre 1-365 dias
4. Reinicie o servidor se necessário

---

## 📝 Changelog

### Versão 1.0 (2025-11-06)
- ✅ Comandos básicos (stats, overlap, revenue)
- ✅ Comandos avançados (comparison, weekday, daily)
- ✅ Suporte a aliases em português
- ✅ Formatação rica de mensagens
- ✅ Insights automáticos

---

**Última atualização:** 6 de novembro de 2025

