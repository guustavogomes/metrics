# Newsletter Metrics

Sistema de métricas para gestão de newsletters do Beehiiv, desenvolvido com Next.js 14, TypeScript, Prisma, e NextAuth.

## Tecnologias Utilizadas

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **Neon** - PostgreSQL serverless
- **NextAuth.js** - Autenticação
- **Shadcn/ui** - Componentes UI
- **TailwindCSS** - Estilização
- **React Query** - Gerenciamento de estado assíncrono
- **Zod** - Validação de schemas
- **React Hook Form** - Gerenciamento de formulários

## Arquitetura SOLID

O projeto segue os princípios SOLID:

- **Single Responsibility Principle**: Cada classe/módulo tem uma única responsabilidade
  - Repositórios: Apenas operações de dados
  - Use Cases: Apenas lógica de negócio
  - Services: Apenas integração com APIs externas

- **Open/Closed Principle**: Aberto para extensão, fechado para modificação

- **Liskov Substitution Principle**: Implementações podem ser substituídas por suas interfaces

- **Interface Segregation Principle**: Interfaces específicas para cada necessidade

- **Dependency Inversion Principle**: Dependência de abstrações (interfaces), não de implementações

### Estrutura de Pastas

```
lib/
├── interfaces/          # Interfaces e contratos
│   ├── repositories.ts  # Interfaces dos repositórios
│   └── services.ts      # Interfaces dos serviços
├── repositories/        # Implementação dos repositórios
│   ├── publication-repository.ts
│   └── metric-repository.ts
├── services/           # Serviços externos (Beehiiv API)
│   └── beehiiv-service.ts
├── use-cases/          # Casos de uso (lógica de negócio)
│   ├── sync-publications.ts
│   ├── sync-metrics.ts
│   └── get-publication-metrics.ts
├── types.ts            # DTOs e tipos
├── utils.ts            # Utilitários
└── prisma.ts           # Cliente Prisma
```

## Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha as variáveis:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=sua-connection-string-neon

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32

# Beehiiv API
BEEHIIV_API_KEY=sua-api-key-beehiiv

# Node Environment
NODE_ENV=development
```

### 3. Configurar Banco de Dados

```bash
# Executar migrations
npx prisma migrate dev

# Ou fazer push do schema (para desenvolvimento)
npx prisma db push

# Abrir Prisma Studio (interface visual do banco)
npx prisma studio
```

### 4. Executar o Projeto

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm run start
```

## Funcionalidades

### Autenticação
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Proteção de rotas
- ✅ Sessões com JWT

### Dashboard
- ✅ Visão geral das métricas
- 🚧 Gráficos de desempenho
- 🚧 Comparação de períodos

### Publicações
- 🚧 Sincronização com Beehiiv
- 🚧 Listagem de publicações
- 🚧 Detalhes de cada publicação

### Métricas
- 🚧 Sincronização automática
- 🚧 Histórico de métricas
- 🚧 Taxas de abertura, cliques e cancelamentos
- 🚧 Análise de crescimento

## Deploy na Vercel

### 1. Conectar Repositório

1. Faça push do código para GitHub
2. Acesse [Vercel](https://vercel.com)
3. Importe o repositório

### 2. Configurar Variáveis de Ambiente

Adicione as mesmas variáveis do `.env` no painel da Vercel:

- `DATABASE_URL`
- `NEXTAUTH_URL` (use a URL da Vercel)
- `NEXTAUTH_SECRET`
- `BEEHIIV_API_KEY`

### 3. Deploy

A Vercel fará o deploy automaticamente a cada push.

## Webhooks do Beehiiv

Para receber dados em tempo real do Beehiiv, você pode usar ngrok localmente:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 3000
```

Configure a URL gerada pelo ngrok nos webhooks do Beehiiv.

## Estrutura de Rotas

### Rotas Públicas
- `/login` - Página de login
- `/register` - Página de registro

### Rotas Protegidas (requer autenticação)
- `/dashboard` - Dashboard principal
- `/publications` - Listagem de publicações
- `/publications/[id]` - Detalhes da publicação

### API Routes
- `/api/auth/*` - Rotas do NextAuth
- `/api/publications` - CRUD de publicações
- `/api/metrics` - CRUD de métricas
- `/api/sync/publications` - Sincronizar publicações do Beehiiv
- `/api/sync/metrics` - Sincronizar métricas do Beehiiv

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

MIT
