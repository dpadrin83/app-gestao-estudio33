# Decisões — Hub Estúdio 33

> Log de decisões técnicas e de produto tomadas ao longo do projeto. Cada decisão entra como uma entrada nova com data, contexto e justificativa.

Formato sugerido:

```
## YYYY-MM-DD — Título curto da decisão
**Contexto:** o que provocou a decisão.
**Decisão:** o que foi escolhido.
**Por quê:** justificativa em 1-3 linhas.
**Alternativas descartadas:** o que foi considerado e não escolhido.
```

---

## 2026-05-18 — Fase 1 implementada: núcleo operacional

**Contexto:** PRD da Fase 1 recebido. 7 etapas executadas em sequência, cada uma com seu commit.

**Decisões técnicas tomadas durante a implementação:**

- **Layout via route group `(app)/`** com `AppShell` server component, em vez de `(auth)/` + `(admin)/` separados — só uma área autenticada por enquanto, simplificar agora vale a pena. Reorganizar quando o portal do cliente entrar (Fase 3).
- **Server actions, sem API routes.** Conforme PRD. `revalidatePath` após cada mutation.
- **react-hook-form + zodResolver** para forms. `Controller` no Select (shadcn select usa base-ui, controlado).
- **shadcn novo (base-ui) não tem `Button asChild`** — workaround: usar `<Link className={buttonVariants(...)}>` direto. Documentado pra reutilizar.
- **Sonner sem `next-themes`** — toaster com `theme="dark"` fixo. Hub é dark-only por enquanto.
- **Regra "uma sessão ativa por vez" implementada na server action**, não no banco. `startSession` faz UPDATE de qualquer sessão aberta antes de inserir a nova. Mais flexível que constraint Postgres, suficiente pra single-user.
- **Stats do dashboard calculadas em JS**, não em Postgres. Range de datas (semana + mês) é buscado uma vez e processado in-memory. Quando crescer, migrar pra função SQL.
- **Server actions só exportam funções async.** Aprendi na primeira build: re-exportar tipos de um arquivo `"use server"` quebra o build. Tipos vivem em `src/types/database.ts` e são importados diretamente.
- **Schema do projeto: datas e valor como string opcional** (vazio = null) em vez de `preprocess` zod → conflito com tipo input/output do RHF. Normalização vira responsabilidade da action.
- **Middleware roda na raiz `src/middleware.ts`.** Next 16 emite warning sobre renomear para "proxy" — ignorado por enquanto, ainda funciona; renomeação só por consistência futura.

**Validação:** `npx tsc --noEmit` sem erros. `npm run build` gera todas as 11 rotas. Smoke test com curl: `/` redireciona (307), `/login` 200, rotas privadas redirecionam para `/login` quando sem auth.

**Pendente para o Danilo (single-user manual):**
- Criar projeto Supabase
- Aplicar migration
- Criar usuário admin
- Preencher `.env.local`

**Arquivos principais:**
- `src/middleware.ts` + `src/lib/supabase/{server,browser,middleware}.ts` — auth
- `src/app/(app)/` — todas as telas autenticadas
- `src/lib/actions/` — server actions (auth, clients, projects, sessions)
- `src/lib/schemas/` — zod schemas
- `src/lib/queries/stats.ts` — dashboard stats
- `src/lib/format.ts` — formatação PT-BR (duração, datas, moeda)
- `supabase/migrations/20260518000001_initial_schema.sql` — schema + RLS

---

## 2026-05-18 — Setup técnico: Next 16 + Tailwind 4 + shadcn/ui na raiz do projeto

**Contexto:** identidade visual aprovada, hora de criar o app Next.js e aplicar os tokens. A pasta já continha briefing, docs e mockups — não dava pra rodar `create-next-app` direto na pasta vazia.

**Decisão:**
- **Next 16.2 + Tailwind 4 + React 19** (vieram como latest do `create-next-app`). Configuração padrão moderna: App Router, TypeScript strict, src/ directory, alias `@/*`, ESLint, npm.
- **Código na raiz do projeto**, ao lado dos docs (`docs/`, `prds/`, `briefing.md`). Sem subpasta de app separada — uma raiz única para tudo.
- **Tailwind 4** sem `tailwind.config.ts` — toda configuração via `@theme inline` no `globals.css`. Tokens shadcn (`bg-background`, etc.) e tokens brand (`bg-brand-pink`, etc.) declarados juntos em um só lugar.
- **shadcn/ui** inicializado com base `neutral`, depois sobrescrito com tokens E33 reais. Componentes instalados: button, card, badge, separator, table.
- **Fontes via `next/font/google`** com `display: swap`: Geist (UI), Geist Mono (dados), Instrument Serif (display ocasional).
- **`html.dark` forçado** no layout — Hub é dark-only por enquanto. `next-themes` não instalado (pulado, como permitido pelo briefing).
- **Supabase SDKs instalados mas não usados ainda** (`@supabase/supabase-js` + `@supabase/ssr`) — cliente real será criado no início da Fase 1 em `src/lib/supabase/`.
- **Página `/` é um showcase visual** da identidade — será substituída na Fase 1.

**Por quê:**
- Raiz única evita confusão de "qual pasta abrir no Cursor". Docs, código e mockups convivem no mesmo lugar versionado pelo git.
- Tailwind 4 + `@theme inline` é o caminho moderno — config em CSS é mais simples, menos arquivos para manter sincronizados.
- Forçar dark agora simplifica setup. Toggle dark/claro pode entrar depois se houver demanda real.
- Showcase como home garante que qualquer divergência da identidade aparece imediatamente — funciona como "smoke test visual" do design system.

**Alternativas descartadas:**
- **Subpasta `app/` ou `web/`** para o Next — descartado por complicar imports de docs e dobrar a estrutura.
- **Pages Router** — não dá pra usar com shadcn moderno + Server Components.
- **`tailwind.config.ts` separado** — Tailwind 4 desencoraja, prefere CSS-first.
- **`next-themes` agora** — adia até existir necessidade real de toggle.
- **`tailwind.config` com base color slate/zinc** — escolhi `neutral` no shadcn init e sobrescrevi tudo, pra não ter cor base "competindo" com a brand.

**Resultado validado:** TypeScript passou sem erros (`tsc --noEmit`), servidor dev compilou em <2s, `/` responde HTTP 200 com tokens aplicados (brand-stripe, gradient text, badges coloridos, mini Gantt).

**Arquivos:**
- [src/app/globals.css](../src/app/globals.css) — tokens
- [src/app/layout.tsx](../src/app/layout.tsx) — fontes + dark default
- [src/app/page.tsx](../src/app/page.tsx) — showcase
- [src/components/logo-e33.tsx](../src/components/logo-e33.tsx) — logo SVG inline
- [docs/arquitetura.md](arquitetura.md) — referência viva da estrutura

---

## 2026-05-18 — Identidade visual: Hub · E33 Dark (fusão Hangar + brand oficial)

**Contexto:** apresentei 3 direções visuais genéricas (Bureau editorial, Hangar técnico-escuro, Atelier expressivo). O Danilo gostou da personalidade da Hangar mas trouxe os arquivos do design system oficial do Estúdio 33 (DS v1 + v2 Brand) com paleta, gradiente e Geist já estabelecidos. Pediu fusão. Primeira versão saiu clara — pediu dark e mais inspiração das duas refs (Aura Learning, Aurora Garden Control).

**Decisão:** direção final = **Hub · E33 Dark**. Fundo dark `#0A0B10` com mesh gradient ambiente das cores brand. Geist + Geist Mono. Cards mistos: sólidos brand vibrantes para destaques (foco do dia, faturamento, capacidade) + glass dark com border-gradient para info secundária. Linhas de projeto em pill arredondadas com gradient pastel da cor do módulo (estilo Aura). Brand-stripe gradient de 3px no topo. Greeting com gradient-text no nome.

**Por quê:** a Hangar acertou na densidade técnica e atalhos, mas a identidade visual oficial do E33 já existe e deve vencer paletas inventadas. Aplicar o espírito Hangar (compact, mono, ⌘K, atalhos) sobre os tokens reais da marca preserva consistência entre os sistemas do estúdio. Dark realça a paleta brand de forma mais marcante que claro.

**Alternativas descartadas:** Bureau (editorial calmo, claro) — não combina com densidade de Gantt + dashboards técnicos. Atelier (expressivo serif-display) — depende de execução fina demais para uso interno. Hub-claro (primeira tentativa de fusão) — perdeu o "pop" da paleta brand.

**Arquivos:**
- Direção viva: [mockups/hub.html](mockups/hub.html)
- Tokens consolidados: [identidade-visual.md](identidade-visual.md)
- Históricas: [mockups/bureau.html](mockups/bureau.html), [mockups/hangar.html](mockups/hangar.html), [mockups/atelier.html](mockups/atelier.html)

