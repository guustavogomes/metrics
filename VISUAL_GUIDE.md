# 📸 Guia Visual do Sistema

## 🏠 Fluxo da Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                      PÁGINA INICIAL (/)                      │
│                                                              │
│  → Verifica autenticação                                     │
│  → Se autenticado: redireciona para /dashboard              │
│  → Se não autenticado: redireciona para /login              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── Não autenticado
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      LOGIN (/login)                          │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Newsletter Metrics                             │        │
│  │  Sistema de métricas para gestão de newsletters│        │
│  │                                                  │        │
│  │  ┌──────────────────────────────────┐          │        │
│  │  │ Email    [admin@metrics.com    ] │          │        │
│  │  │ Senha    [••••••••••••••••••••] │          │        │
│  │  │                                   │          │        │
│  │  │        [  Entrar  ]              │          │        │
│  │  │                                   │          │        │
│  │  │ Não tem conta? Cadastre-se       │          │        │
│  │  └──────────────────────────────────┘          │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Login com sucesso
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD (/dashboard)                   │
│                                                              │
│  ┌─ Header ─────────────────────────────────────────────┐  │
│  │ Newsletter Metrics  │  Dashboard  Publicações   [👤] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Bem-vindo, Admin!                                          │
│  Aqui está um resumo das suas newsletters                   │
│                                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Total  │  │ Taxa de│  │ Novos  │  │Publica-│          │
│  │Inscri- │  │Abertura│  │Inscri- │  │  ções  │          │
│  │  tos   │  │   0%   │  │  tos   │  │ Ativas │          │
│  │   0    │  │        │  │   0    │  │   10   │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Próximos Passos                                       │  │
│  │                                                        │  │
│  │ 1️⃣ Configure sua API Key do Beehiiv                   │  │
│  │ 2️⃣ Adicione suas publicações                          │  │
│  │ 3️⃣ Visualize suas métricas                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Clica em "Publicações"
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 PUBLICAÇÕES (/publications)                  │
│                                                              │
│  ┌─ Header ─────────────────────────────────────────────┐  │
│  │ Newsletter Metrics  │  Dashboard  Publicações   [👤] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Publicações                         [🔄 Atualizar]         │
│  Gerencie suas newsletters do Beehiiv                       │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ The Bizness   │  │  The News     │  │  The Stories  │  │
│  │               │  │               │  │               │  │
│  │ Newsletter    │  │ Newsletter    │  │ Newsletter    │  │
│  │ The Bizness   │  │ The News      │  │ The Stories   │  │
│  │               │  │               │  │               │  │
│  │ ID: pub_98... │  │ ID: pub_ce... │  │ ID: pub_e6... │  │
│  │               │  │               │  │               │  │
│  │[📊 Ver Métric]│  │[📊 Ver Métric]│  │[📊 Ver Métric]│  │
│  │               │  │               │  │               │  │
│  │ Criado em:    │  │ Criado em:    │  │ Criado em:    │  │
│  │ 11/10/2025    │  │ 11/10/2025    │  │ 11/10/2025    │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  The Jobs     │  │  The Champs   │  │    Rising     │  │
│  │    ...        │  │     ...       │  │     ...       │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │   Go Get      │  │ Health Times  │  │ Dollar Bill   │  │
│  │    ...        │  │     ...       │  │     ...       │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
│                                                              │
│  ┌───────────────┐                                          │
│  │ Trend Report  │                                          │
│  │    ...        │                                          │
│  └───────────────┘                                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📊 Total de Publicações                               │  │
│  │ 10                                                     │  │
│  │ Newsletters cadastradas no sistema                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Clica em "Ver Métricas"
                              ▼
┌─────────────────────────────────────────────────────────────┐
│             DETALHES (/publications/[id])                    │
│                                                              │
│  ┌─ Header ─────────────────────────────────────────────┐  │
│  │ Newsletter Metrics  │  Dashboard  Publicações   [👤] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [←]  The Bizness                                           │
│        Newsletter The Bizness                                │
│                                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Total  │  │ Taxa de│  │ Taxa de│  │ Novos  │          │
│  │Inscri- │  │Abertura│  │Cliques │  │Inscri- │          │
│  │  tos   │  │        │  │        │  │  tos   │          │
│  │  0     │  │  0%    │  │  0%    │  │   0    │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Informações da Publicação                             │  │
│  │ Detalhes e configurações                              │  │
│  │                                                        │  │
│  │ Beehiiv ID:        pub_98577126-2994-4111-bc86-f60... │  │
│  │ Criado em:         📅 11 de outubro de 2025           │  │
│  │ Última atualização: 11 de outubro de 2025, 17:30     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Estrutura de Arquivos Criada

```
C:\Projetos\Metricas\
│
├── 📁 app/
│   ├── 📁 (auth)/                    # Route Group - Páginas de autenticação
│   │   ├── 📁 login/
│   │   │   └── 📄 page.tsx           ✅ Página de login
│   │   ├── 📁 register/
│   │   │   └── 📄 page.tsx           ✅ Página de registro
│   │   └── 📄 layout.tsx             ✅ Layout centralizado
│   │
│   ├── 📁 (dashboard)/               # Route Group - Páginas do dashboard
│   │   ├── 📁 dashboard/
│   │   │   └── 📄 page.tsx           ✅ Dashboard principal
│   │   ├── 📁 publications/
│   │   │   ├── 📁 [id]/
│   │   │   │   └── 📄 page.tsx       ✅ Detalhes da publicação
│   │   │   └── 📄 page.tsx           ✅ Listagem de publicações
│   │   └── 📄 layout.tsx             ✅ Layout com header e nav
│   │
│   ├── 📁 actions/
│   │   └── 📄 auth.ts                ✅ Server actions
│   │
│   ├── 📁 api/
│   │   ├── 📁 auth/[...nextauth]/
│   │   │   └── 📄 route.ts           ✅ NextAuth API
│   │   └── 📁 publications/
│   │       ├── 📁 [id]/
│   │       │   ├── 📁 metrics/
│   │       │   │   └── 📄 route.ts   ✅ GET métricas
│   │       │   └── 📄 route.ts       ✅ GET/PUT/DELETE
│   │       └── 📄 route.ts           ✅ GET/POST
│   │
│   ├── 📄 globals.css                ✅ Estilos globais
│   ├── 📄 layout.tsx                 ✅ Root layout
│   └── 📄 page.tsx                   ✅ Página inicial
│
├── 📁 components/
│   ├── 📁 ui/                        # Componentes shadcn/ui
│   │   ├── 📄 button.tsx             ✅
│   │   ├── 📄 card.tsx               ✅
│   │   ├── 📄 dropdown-menu.tsx      ✅
│   │   ├── 📄 input.tsx              ✅
│   │   └── 📄 label.tsx              ✅
│   ├── 📄 publication-card.tsx       ✅ Card de publicação
│   └── 📄 user-nav.tsx               ✅ Menu do usuário
│
├── 📁 lib/
│   ├── 📁 constants/
│   │   └── 📄 publications.ts        ✅ Lista de newsletters
│   │
│   ├── 📁 interfaces/
│   │   ├── 📄 repositories.ts        ✅ Interfaces dos repositórios
│   │   └── 📄 services.ts            ✅ Interfaces dos serviços
│   │
│   ├── 📁 repositories/
│   │   ├── 📄 publication-repository.ts  ✅ Repositório de publicações
│   │   └── 📄 metric-repository.ts       ✅ Repositório de métricas
│   │
│   ├── 📁 services/
│   │   └── 📄 beehiiv-service.ts     ✅ Integração com Beehiiv API
│   │
│   ├── 📁 use-cases/
│   │   ├── 📄 sync-publications.ts   ✅ Sincronizar publicações
│   │   ├── 📄 sync-metrics.ts        ✅ Sincronizar métricas
│   │   └── 📄 get-publication-metrics.ts  ✅ Buscar métricas
│   │
│   ├── 📄 prisma.ts                  ✅ Cliente Prisma
│   ├── 📄 types.ts                   ✅ DTOs e tipos
│   └── 📄 utils.ts                   ✅ Utilitários
│
├── 📁 prisma/
│   ├── 📄 schema.prisma              ✅ Schema do banco
│   └── 📄 seed.ts                    ✅ Script de seed
│
├── 📁 providers/
│   └── 📄 query-provider.tsx         ✅ React Query provider
│
├── 📄 auth.config.ts                 ✅ Configuração NextAuth
├── 📄 auth.ts                        ✅ Setup NextAuth
├── 📄 middleware.ts                  ✅ Middleware de auth
├── 📄 .env                           ✅ Variáveis de ambiente
├── 📄 .env.example                   ✅ Exemplo de variáveis
├── 📄 package.json                   ✅ Dependências
├── 📄 tsconfig.json                  ✅ Config TypeScript
├── 📄 tailwind.config.ts             ✅ Config Tailwind
│
└── 📚 Documentação
    ├── 📄 README.md                  ✅ Documentação principal
    ├── 📄 USAGE_EXAMPLES.md          ✅ Exemplos de uso
    ├── 📄 NEXT_STEPS.md              ✅ Próximos passos
    ├── 📄 PROJECT_SUMMARY.md         ✅ Resumo do projeto
    ├── 📄 SETUP_COMPLETE.md          ✅ Setup completo
    └── 📄 VISUAL_GUIDE.md            ✅ Este arquivo
```

## 🎨 Componentes UI

### Publication Card
```tsx
┌─────────────────────────────────────┐
│ The Bizness                      🔗 │
│ Newsletter The Bizness              │
│                                     │
│ 📈 ID: pub_98577126...              │
│                                     │
│           [📊 Ver Métricas]         │
│                                     │
│ Criado em 11/10/2025                │
└─────────────────────────────────────┘
```

### Metrics Cards
```tsx
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Total de       │  │ Taxa de        │  │ Taxa de        │
│ Inscritos      │  │ Abertura       │  │ Cliques        │
│                │  │                │  │                │
│   12,543       │  │    42.5%       │  │    8.3%        │
│                │  │                │  │                │
│ Base atual     │  │ Últimos 30 dias│  │ Últimos 30 dias│
└────────────────┘  └────────────────┘  └────────────────┘
```

## 🔄 Fluxo de Dados

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                             │
│                                                           │
│  ┌──────────────┐         ┌──────────────┐              │
│  │   Página     │ ─────▶  │  React Query │              │
│  │ Publications │         │   (Cache)    │              │
│  └──────────────┘         └──────┬───────┘              │
│                                   │                       │
└───────────────────────────────────┼───────────────────────┘
                                    │ fetch()
                                    ▼
┌──────────────────────────────────────────────────────────┐
│                    API ROUTES                             │
│                                                           │
│  ┌─────────────────────────────────────────────┐        │
│  │  GET /api/publications                       │        │
│  │  ├─ auth() → Verifica autenticação          │        │
│  │  ├─ PublicationRepository.findByUserId()    │        │
│  │  └─ return JSON                              │        │
│  └─────────────────────────────────────────────┘        │
│                                   │                       │
└───────────────────────────────────┼───────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────┐
│                  REPOSITORIES (SOLID)                     │
│                                                           │
│  ┌──────────────────────────────────────────┐           │
│  │  PublicationRepository                    │           │
│  │  ├─ findByUserId(userId)                 │           │
│  │  ├─ findById(id)                         │           │
│  │  ├─ create(data)                         │           │
│  │  ├─ update(id, data)                     │           │
│  │  └─ delete(id)                           │           │
│  └──────────────────┬───────────────────────┘           │
│                     │                                     │
└─────────────────────┼─────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│                  PRISMA CLIENT                            │
│                                                           │
│  prisma.publication.findMany({                           │
│    where: { userId: "..." }                              │
│  })                                                       │
│                     │                                     │
└─────────────────────┼─────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│               NEON POSTGRESQL                             │
│                                                           │
│  Table: publications                                      │
│  ├─ id (cuid)                                            │
│  ├─ beehiivId                                            │
│  ├─ name                                                 │
│  ├─ description                                          │
│  ├─ userId                                               │
│  └─ timestamps                                           │
└──────────────────────────────────────────────────────────┘
```

## 🔐 Fluxo de Autenticação

```
┌─────────────┐
│  /login     │
│  Usuário    │
│  preenche   │
│  form       │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  signIn("credentials", {...})   │
│  ├─ email: admin@metrics.com    │
│  └─ password: admin123          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  auth.config.ts                 │
│  Credentials Provider            │
│  ├─ Valida com Zod              │
│  ├─ Busca user no banco         │
│  ├─ Compara senha (bcrypt)      │
│  └─ Retorna user ou null        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  NextAuth                        │
│  ├─ Cria sessão JWT             │
│  ├─ Define cookie               │
│  └─ Redireciona para /dashboard │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  middleware.ts                   │
│  ├─ Verifica auth em cada rota  │
│  ├─ Protege rotas privadas      │
│  └─ Permite rotas públicas      │
└──────────────────────────────────┘
```

## 📊 Banco de Dados - Schema Visual

```
┌──────────────────────────────────┐
│           users                   │
├──────────────────────────────────┤
│ id (PK)          VARCHAR(25)     │
│ email            VARCHAR UNIQUE   │
│ name             VARCHAR          │
│ password         VARCHAR          │
│ emailVerified    TIMESTAMP        │
│ imageUrl         VARCHAR          │
│ createdAt        TIMESTAMP        │
│ updatedAt        TIMESTAMP        │
└────────┬─────────────────────────┘
         │ 1:N
         │
┌────────▼─────────────────────────┐
│       publications                │
├──────────────────────────────────┤
│ id (PK)          VARCHAR(25)     │
│ beehiivId        VARCHAR UNIQUE   │
│ name             VARCHAR          │
│ description      TEXT             │
│ userId (FK)      VARCHAR(25)     │ ───┐
│ createdAt        TIMESTAMP        │    │
│ updatedAt        TIMESTAMP        │    │ Relacionamento
└────────┬─────────────────────────┘    │ com user
         │ 1:N                           │
         │                               │
┌────────▼─────────────────────────┐    │
│         metrics                   │    │
├──────────────────────────────────┤    │
│ id (PK)          VARCHAR(25)     │    │
│ publicationId(FK)VARCHAR(25)     │◄───┘
│ date             DATE             │
│ subscribers      INT              │
│ opens            INT              │
│ clicks           INT              │
│ unsubscribes     INT              │
│ newSubs          INT              │
│ createdAt        TIMESTAMP        │
│ updatedAt        TIMESTAMP        │
│                                   │
│ UNIQUE(publicationId, date)      │
└──────────────────────────────────┘
```

## 🚀 Estado Atual

✅ **10 Newsletters Cadastradas:**
1. The Bizness
2. The News
3. The Stories
4. The Jobs
5. The Champs
6. Rising
7. Go Get
8. Health Times
9. Dollar Bill
10. Trend Report

✅ **Usuário Admin Criado:**
- Email: admin@metrics.com
- Senha: admin123

✅ **Beehiiv API Configurada:**
- API Key: [CONFIGURADA VIA VARIÁVEL DE AMBIENTE]

✅ **Sistema 100% Funcional!**

---

**Pronto para uso! Execute `npm run dev` e acesse http://localhost:3000** 🎉
