# Arquitetura — Hub Estúdio 33

> Atualizado em 2026-05-18 (fim do setup técnico). Este doc cresce ao longo das fases — registramos só o que já é verdade hoje.

## Stack atual

- **Framework:** Next.js 16.2 (App Router) + React 19
- **Linguagem:** TypeScript em strict mode
- **Estilo:** Tailwind CSS 4 (config via `@theme inline` no CSS, sem `tailwind.config.ts`)
- **Componentes:** shadcn/ui (rendering via @base-ui/react)
- **Ícones:** lucide-react
- **Fontes:** Geist + Geist Mono + Instrument Serif via `next/font` (com `display: swap`)
- **Cliente HTTP / DB:** `@supabase/supabase-js` + `@supabase/ssr` (instalados, ainda não usados)
- **Gerenciador:** npm
- **Versionamento:** git (repo local, sem remote configurado ainda)

## Estrutura de pastas

```
APP_GESTAO-ESTUDIO33/
├── CONTEXTO.md              ← porta de entrada (ler primeiro)
├── README.md
├── briefing.md              ← briefing completo do sistema
├── briefing-sistema-gestao-e33.md (original preservado)
├── .env.local.example       ← variáveis de ambiente (template)
├── .gitignore
├── components.json          ← config do shadcn CLI
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts            (gerado, no .gitignore)
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── AGENTS.md / CLAUDE.md    ← avisos do Next 16 para agentes de IA
│
├── docs/
│   ├── identidade-visual.md ← tokens prontos para Tailwind/shadcn
│   ├── arquitetura.md       ← este arquivo
│   ├── decisoes.md          ← log de decisões
│   └── mockups/             ← protótipos HTML (referência viva)
│       ├── hub.html         ← direção visual aprovada
│       └── bureau/hangar/atelier (históricos)
│
├── prds/
│   └── README.md            ← PRDs por fase entram aqui
│
├── _ARQUIVO/                ← versões antigas / referência
│
├── public/                  ← assets estáticos do Next
│
└── src/
    ├── app/
    │   ├── layout.tsx       ← root layout (dark forçado, fontes via next/font, metadata)
    │   ├── page.tsx         ← showcase visual (será substituído na Fase 1)
    │   ├── globals.css      ← tokens E33 + @theme inline + utilities custom
    │   └── favicon.ico
    ├── components/
    │   ├── logo-e33.tsx     ← logo oficial SVG inline (currentColor para wordmark)
    │   └── ui/              ← componentes shadcn (button, card, badge, separator, table)
    └── lib/
        └── utils.ts         ← helper `cn()` (clsx + tailwind-merge)
```

## Onde fica cada coisa

### Tokens de design
- **Fonte de verdade visual:** [docs/identidade-visual.md](identidade-visual.md)
- **Implementação:** [src/app/globals.css](../src/app/globals.css)
  - `:root` / `.dark` declaram as cores em hex
  - `@theme inline` mapeia para tokens shadcn (`bg-background`, `text-foreground` etc.) e tokens brand (`bg-brand-pink`, `text-brand-orange` etc.)
  - `@utility` definem classes customizadas: `.brand-stripe`, `.brand-grad-bg`, `.brand-grad-diag`, `.text-brand-grad`, `.card-glass`

### Fontes
- Carregadas em [src/app/layout.tsx](../src/app/layout.tsx) via `next/font/google`
- Cada fonte gera uma CSS variable: `--font-geist-sans`, `--font-geist-mono`, `--font-instrument-serif`
- Mapeadas em globals.css como `--font-sans`, `--font-mono`, `--font-serif`
- Uso no Tailwind: `font-sans`, `font-mono`, `font-serif`

### Componentes shadcn
- Ficam em [src/components/ui/](../src/components/ui/)
- Adicionar mais: `npx shadcn@latest add <componente>`
- Lista atual: button, card, badge, separator, table

### Helpers
- `cn()` em [src/lib/utils.ts](../src/lib/utils.ts) — combina classes Tailwind com merge inteligente

## Decisões para quando o código crescer

Estes caminhos ainda **não existem fisicamente** — serão criados no início da Fase 1 conforme a necessidade. Registrado aqui para garantir consistência futura:

### Cliente Supabase
- `src/lib/supabase/server.ts` — client SSR (server components, route handlers, server actions). Usa `@supabase/ssr` com cookies.
- `src/lib/supabase/browser.ts` — client browser (client components). Usa `@supabase/ssr` com a chave anon.
- `src/lib/supabase/admin.ts` — client com service-role para operações que precisam contornar RLS (jobs, migrations programáticas). **Nunca importar de client components.**

### Tipos compartilhados
- `src/types/` — tipos de domínio (Cliente, Projeto, Atividade, Entregavel, etc.)
- `src/types/database.ts` — tipos gerados pelo Supabase CLI a partir do schema do banco

### Estrutura de rotas (App Router)
- `src/app/(auth)/` — login, signup, recuperação de senha (route group sem prefixo de URL)
- `src/app/(admin)/` — área admin do Danilo (dashboard, projetos, clientes, etc.)
- `src/app/(portal)/` — portal do cliente externo
- `src/app/api/` — route handlers (webhooks, jobs)

### Edge Functions / lógica de banco
- Função Postgres + Supabase Edge Function ficam **no repo do Supabase**, não dentro deste projeto Next.
- Quando criadas, ganham uma pasta `supabase/migrations/` e `supabase/functions/` na raiz.

## Como rodar

```bash
npm install                              # 1× só (já feito no setup)
cp .env.local.example .env.local         # quando tiver as chaves Supabase
npm run dev                              # sobe em http://localhost:3000
```

Se a porta 3000 estiver ocupada por outro app, o Next escolhe outra (3001, 3002…) e mostra no terminal.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção (após `build`) |
| `npm run lint` | Roda ESLint |
| `npx tsc --noEmit` | Type-check sem gerar arquivos |
| `npx shadcn@latest add <nome>` | Adiciona um componente shadcn novo |
