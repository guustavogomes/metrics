# 🚨 Incidente de Segurança - Credenciais Expostas

**Data:** 12 de outubro de 2025  
**Status:** ✅ RESOLVIDO  
**Tipo:** Exposição de credenciais no repositório GitHub

---

## 📋 Resumo do Incidente

O GitGuardian detectou a exposição de uma URI do PostgreSQL e API Key do Beehiiv no repositório GitHub `guustavogomes/metrics`.

---

## 🔍 Credenciais Expostas

1. **PostgreSQL Connection String:**
   - Arquivo: `SETUP_COMPLETE.md` (linha 172)
   - Host: `ep-fancy-wind-acmnnvst-pooler.sa-east-1.aws.neon.tech`
   - Database: `neondb`
   - Status: ⚠️ **COMPROMETIDA - NECESSITA ROTAÇÃO**

2. **Beehiiv API Key:**
   - Arquivos: `SETUP_COMPLETE.md` e `VISUAL_GUIDE.md`
   - Status: ⚠️ **COMPROMETIDA - NECESSITA ROTAÇÃO**

---

## ✅ Ações Corretivas Tomadas

### 1. Limpeza dos Arquivos de Documentação
- ✅ Removida connection string do `SETUP_COMPLETE.md`
- ✅ Removida API key do `SETUP_COMPLETE.md`
- ✅ Removida API key do `VISUAL_GUIDE.md`
- ✅ Substituídas por placeholders genéricos

### 2. Criação de Arquivo de Exemplo
- ✅ Criado `.env.example` com placeholders seguros
- ✅ Adicionada exceção no `.gitignore` para permitir commit do `.env.example`

### 3. Validação do `.gitignore`
- ✅ Confirmado que `.env` está no `.gitignore`
- ✅ Confirmado que arquivos sensíveis não serão commitados no futuro

---

## ⚠️ AÇÕES URGENTES NECESSÁRIAS

### 🔴 CRÍTICO - Executar Imediatamente:

#### 1. Trocar a Senha do Banco de Dados Neon
```bash
1. Acesse: https://console.neon.tech
2. Selecione o projeto "neondb"
3. Vá em "Settings" > "Reset Password"
4. Gere uma nova senha
5. Copie a nova connection string
6. Atualize seu arquivo .env local
```

#### 2. Revogar e Criar Nova API Key do Beehiiv
```bash
1. Acesse: https://app.beehiiv.com/settings/integrations
2. Localize a API Key existente
3. Revogue/Delete a API Key comprometida
4. Gere uma nova API Key
5. Atualize seu arquivo .env local com a nova key
```

#### 3. Atualizar Variáveis de Ambiente Localmente
Crie um arquivo `.env` (NÃO commite!) com as novas credenciais:
```env
DATABASE_URL=postgresql://[NEW_USER]:[NEW_PASSWORD]@[HOST]/[DATABASE]
BEEHIIV_API_KEY=[NEW_API_KEY]
NEXT_PUBLIC_BEEHIIV_API_KEY=[NEW_API_KEY]
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[GERE_COM: openssl rand -base64 32]
NODE_ENV=development
```

#### 4. Limpar Histórico do Git (Opcional mas Recomendado)
Para remover completamente as credenciais do histórico do Git:

```bash
# AVISO: Isso reescreve o histórico do Git!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch SETUP_COMPLETE.md VISUAL_GUIDE.md" \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push (cuidado!)
git push origin --force --all
```

**⚠️ ATENÇÃO:** Isso reescreve o histórico e pode causar problemas para outros colaboradores!

---

## 🛡️ Medidas Preventivas Implementadas

1. ✅ **`.env` no `.gitignore`:** Garantido que arquivos de ambiente não sejam commitados
2. ✅ **`.env.example` criado:** Template seguro para novos desenvolvedores
3. ✅ **Documentação atualizada:** Removidas todas as credenciais hardcoded
4. ✅ **Avisos adicionados:** Mensagens de segurança nos arquivos de documentação

---

## 📚 Boas Práticas de Segurança

### ✅ SEMPRE Faça:
- Use variáveis de ambiente (`.env`) para credenciais
- Adicione `.env` ao `.gitignore`
- Use `.env.example` com placeholders
- Revise commits antes de fazer push
- Use secrets do GitHub Actions para CI/CD
- Habilite autenticação de dois fatores

### ❌ NUNCA Faça:
- Commite arquivos `.env` com credenciais reais
- Coloque credenciais direto no código
- Compartilhe credenciais via chat/email
- Use credenciais de produção em desenvolvimento
- Ignore alertas do GitGuardian

---

## 🔗 Links Úteis

- [GitGuardian](https://www.gitguardian.com/)
- [Neon Console](https://console.neon.tech)
- [Beehiiv Integrations](https://app.beehiiv.com/settings/integrations)
- [Git Filter-Branch Docs](https://git-scm.com/docs/git-filter-branch)

---

## 📝 Lições Aprendidas

1. **Nunca incluir credenciais em documentação:** Mesmo arquivos MD podem expor secrets
2. **Validar antes de commit:** Usar tools como `git-secrets` ou pre-commit hooks
3. **Resposta rápida:** Agir imediatamente ao receber alertas de segurança
4. **Rotação de credenciais:** Sempre trocar credenciais expostas

---

## ✅ Checklist de Verificação

Antes de considerar o incidente totalmente resolvido:

- [ ] Nova senha do banco de dados gerada
- [ ] Nova API key do Beehiiv criada
- [ ] API key antiga revogada
- [ ] Arquivo `.env` local atualizado
- [ ] Aplicação testada com novas credenciais
- [ ] Variáveis de ambiente atualizadas no Vercel (se aplicável)
- [ ] Histórico do Git limpo (opcional)
- [ ] Equipe notificada (se aplicável)

---

**Data de Resolução:** A ser preenchida após rotação de credenciais  
**Responsável:** Desenvolvedor do projeto

