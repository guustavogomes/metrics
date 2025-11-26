# MCP - Slack Bot para Análise de Métricas do Pixel

Este é um servidor MCP (Model Context Protocol) que permite solicitar análises de dados do Pixel através do Slack.

## 🚀 Funcionalidades

- **Estatísticas do Pixel**: Obtenha estatísticas gerais de leitores únicos por edição
- **Análise de Overlap**: Analise a sobreposição de leitores entre edições e receita
- **Estatísticas de Receita**: Visualize métricas de monetização e RPM

## 📋 Pré-requisitos

1. Node.js 18+ instalado
2. Conta no Slack com permissões para criar apps
3. Acesso ao banco de dados PostgreSQL do Pixel

## 🔧 Configuração

### 1. Criar App no Slack

1. Acesse [api.slack.com/apps](https://api.slack.com/apps)
2. Clique em "Create New App" → "From scratch"
3. Dê um nome ao app (ex: "Pixel Analytics Bot")
4. Selecione o workspace

### 2. Configurar OAuth & Permissions

1. No menu lateral, vá em "OAuth & Permissions"
2. Em "Scopes" → "Bot Token Scopes", adicione:
   - `app_mentions:read`
   - `chat:write`
   - `commands`
   - `im:read`
   - `im:write`
   - `users:read`

3. Em "Scopes" → "User Token Scopes", adicione:
   - `chat:write`

4. Role para cima e clique em "Install to Workspace"
5. Copie o "Bot User OAuth Token" (começa com `xoxb-`)

### 3. Configurar Socket Mode

1. No menu lateral, vá em "Socket Mode"
2. Ative o Socket Mode
3. Crie um token de app (nome: "default")
4. Copie o token (começa com `xapp-`)

### 4. Criar Slash Command

1. No menu lateral, vá em "Slash Commands"
2. Clique em "Create New Command"
3. Configure:
   - **Command**: `/pixel`
   - **Request URL**: Deixe em branco (usaremos Socket Mode)
   - **Short Description**: Análise de métricas do Pixel
   - **Usage Hint**: `stats [dias]` ou `overlap [dias]` ou `revenue [dias]`

4. Salve o comando

### 5. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o `.env` e preencha:
   ```env
   SLACK_BOT_TOKEN=xoxb-seu-token-aqui
   SLACK_SIGNING_SECRET=seu-signing-secret
   SLACK_APP_TOKEN=xapp-seu-app-token
   
   PIXEL_DB_HOST=24.144.88.69
   PIXEL_DB_PORT=5432
   PIXEL_DB_NAME=waffle_metrics
   PIXEL_DB_USER=waffle
   PIXEL_DB_PASSWORD=sua-senha-aqui
   
   PORT=3000
   ```

## 🏃 Executando

### Desenvolvimento

```bash
npm run dev:mcp
```

### Produção

```bash
npm run start:mcp
```

## 📖 Uso

### Comandos Slash

No Slack, você pode usar:

- `/pixel stats [dias]` - Estatísticas gerais (padrão: 30 dias)
- `/pixel overlap [dias]` - Análise de overlap e receita (padrão: 30 dias)
- `/pixel revenue [dias]` - Estatísticas de receita (padrão: 30 dias)
- `/pixel help` - Mostra ajuda

### Exemplos

```
/pixel stats 30
/pixel overlap 90
/pixel revenue 7
/pixel help
```

### Mensagens Diretas

Você também pode enviar mensagens diretas ao bot com palavras-chave:

- "pixel stats 30 dias"
- "overlap 90"
- "receita dos últimos 7 dias"

## 🏗️ Estrutura

```
mcp/
├── server.ts                    # Servidor principal
├── services/
│   └── pixel-analytics-service.ts  # Serviço de análise
├── utils/
│   └── slack-formatter.ts       # Formatação de mensagens
├── .env.example                 # Exemplo de configuração
└── README.md                    # Esta documentação
```

## 🔒 Segurança

- Nunca commite o arquivo `.env`
- Use variáveis de ambiente para credenciais
- Mantenha os tokens do Slack seguros
- Considere usar um gerenciador de secrets em produção

## 🐛 Troubleshooting

### Erro: "Invalid token"
- Verifique se os tokens estão corretos no `.env`
- Certifique-se de que o bot foi instalado no workspace

### Erro: "Database connection failed"
- Verifique as credenciais do banco no `.env`
- Teste a conexão com o banco separadamente

### Comando não aparece no Slack
- Certifique-se de que o app foi instalado no workspace
- Verifique se o Socket Mode está ativado
- Reinicie o servidor após criar o comando

## 📝 Notas

- O servidor usa Socket Mode, então não precisa de URL pública
- As queries são otimizadas usando cache pré-calculado
- O número máximo de dias é 365 (1 ano)

