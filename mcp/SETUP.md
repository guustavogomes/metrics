# 🚀 Guia Rápido de Configuração

## Passo a Passo

### 1️⃣ Criar App no Slack

**Opção A: Usando Manifest (Recomendado - Mais Rápido)** ⚡

1. Acesse: https://api.slack.com/apps
2. Clique em **"Create New App"** → **"From a manifest"**
3. Selecione o workspace
4. Escolha **"JSON"** como formato
5. Abra o arquivo `mcp/slack-manifest.json` neste projeto
6. **Copie todo o conteúdo** do arquivo e cole na caixa de texto
7. Clique em **"Next"** → **"Create"**
8. ✅ Pronto! O app já está configurado com todas as permissões e comandos

**Opção B: Manual (From scratch)** 🔧

1. Acesse: https://api.slack.com/apps
2. Clique em **"Create New App"** → **"From scratch"**
3. Nome: `Pixel Analytics Bot`
4. Workspace: Selecione o seu

### 2️⃣ Obter Tokens

**Se usou o Manifest (Opção A):**
1. O app já está configurado! Agora precisa apenas obter os tokens:
2. Menu lateral: **OAuth & Permissions**
3. Clique em **"Install to Workspace"** (se ainda não instalou)
4. **Copie o "Bot User OAuth Token"** (começa com `xoxb-`)
5. Menu lateral: **Socket Mode**
6. Clique em **"Create Token"** (se ainda não criou)
   - Nome: `default`
   - Escopo: `connections:write`
7. **Copie o token** (começa com `xapp-`)

**Se foi manual (Opção B):**
1. Menu lateral: **OAuth & Permissions**
2. Em **"Bot Token Scopes"**, adicione:
   - `app_mentions:read`
   - `chat:write`
   - `commands`
   - `im:read`
   - `im:write`
   - `users:read`
3. Clique em **"Install to Workspace"** no topo da página
4. **Copie o "Bot User OAuth Token"** (começa com `xoxb-`)
5. Menu lateral: **Socket Mode**
6. Ative o toggle **"Enable Socket Mode"**
7. Clique em **"Create Token"**
   - Nome: `default`
   - Escopo: `connections:write`
8. **Copie o token** (começa com `xapp-`)
9. Menu lateral: **Slash Commands**
10. Clique em **"Create New Command"**
11. Configure:
    ```
    Command: /pixel
    Request URL: (deixe em branco)
    Short Description: Análise de métricas do Pixel
    Usage Hint: stats [dias] | overlap [dias] | revenue [dias]
    ```
12. Salve

### 3️⃣ Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env` na pasta `mcp/` (ou copie do `.env.example` se existir)
2. Adicione:

```env
# Slack
SLACK_BOT_TOKEN=xoxb-seu-token-aqui
SLACK_SIGNING_SECRET=seu-signing-secret
SLACK_APP_TOKEN=xapp-seu-app-token

# Database
PIXEL_DB_HOST=24.144.88.69
PIXEL_DB_PORT=5432
PIXEL_DB_NAME=waffle_metrics
PIXEL_DB_USER=waffle
PIXEL_DB_PASSWORD=sua-senha

# Server
PORT=3000
```

### 4️⃣ Executar

```bash
npm run dev:mcp
```

Você deve ver:
```
🚀 Servidor MCP Slack iniciado!
📡 Escutando na porta 3000
```

## ✅ Testar

No Slack, digite:
```
/pixel stats 30
```

## 📝 Comandos Disponíveis

- `/pixel stats [dias]` - Estatísticas gerais
- `/pixel overlap [dias]` - Análise de overlap e receita
- `/pixel revenue [dias]` - Estatísticas de receita
- `/pixel help` - Ajuda

## 🐛 Problemas Comuns

**"Invalid token"**
- Verifique se os tokens estão corretos no `.env`
- Certifique-se de que copiou os tokens completos

**"Command not found"**
- Aguarde alguns minutos após criar o comando
- Reinicie o servidor
- Verifique se o app foi instalado no workspace

**"Database connection failed"**
- Verifique as credenciais do banco
- Teste a conexão separadamente

