# CONTEXTO — Hub Estúdio 33

> **Porta de entrada do projeto.** Todo prompt novo no Cursor / Claude Code deve começar lendo este arquivo antes de qualquer outra coisa. Ele evita mistura com outros projetos do Estúdio 33.

## Identidade do projeto
- **Nome:** Hub Estúdio 33
- **Tipo:** Web app interno (uso solo + IA opcional, com acesso restrito de clientes externos)
- **Cliente:** Estúdio 33 (uso próprio do Danilo)
- **Status atual:** Fases 1–8 no código. IA (Fase 4) **opcional** — ativa só com `ANTHROPIC_API_KEY`.

## Stack
Next.js 14+ (App Router) · React 18 · TypeScript strict · Tailwind · shadcn/ui · Supabase (auth + Postgres + storage + RLS + edge functions) · Vercel · Resend (futuro) · Anthropic API (opcional)

Versionamento: GitHub. Construção: Cursor + Claude Code.

## Estrutura de fases
Cada fase é deployável e usável de forma independente. Não pular fase.

- **Fase 1 — Núcleo operacional:** auth (admin + cliente), CRUD de clientes, CRUD de projetos, dashboard mínimo, estrutura de dados pronta pras próximas fases.
- **Fase 2 — Gantt com dependências:** atividades com dependências, recálculo automático (forward scheduling), templates por tipo de projeto, visão por projeto + global, alertas de risco.
- **Fase 3 — Entregáveis, portal do cliente, financeiro, time tracking:** versionamento de entregáveis, portal do cliente com aprovação, orçado x realizado, registro de horas.
- **Fase 4 — Camada de IA e integrações (opcional):** resumos, sugestão de cronograma, insights, webhook Briefing Studio — requer `ANTHROPIC_API_KEY`.
- **Fase 5 — Tarefas Kanban + briefing no projeto:** quadro a fazer / fazendo / feito por projeto, campo briefing no cadastro, dashboard com entregáveis aguardando cliente.
- **Fase 6 — Operação diária:** views Ativos / Em risco / Concluídos, progresso % na lista, feed de atividade no projeto, resumo financeiro global.

## Decisões já tomadas
- **RLS no Supabase desde o início.** Não é opcional. Cliente externo só enxerga os próprios projetos via Row Level Security.
- **Apenas 2 perfis:** admin (Danilo, único usuário interno) e cliente (acesso restrito). Sem perfis intermediários, sem múltiplas equipes internas.
- **Não é multi-tenant SaaS.** É um sistema interno de 1 operador + N clientes. Qualquer feature que assuma "equipe de 10 pessoas" é descartada ou simplificada.
- **Autonomia técnica total do Cursor / Claude Code.** Faz e avisa em PT-BR simples. Não pede permissão para decisões técnicas — decide e justifica em 1 linha.
- **Fasamento obrigatório.** Cada fase deploya na Vercel e é usada de verdade pelo Danilo antes da próxima começar. Sem isso, vira sistema fantasma.
- **Lógica de recálculo do Gantt roda no banco** (função Postgres + Edge Function), não no client.
- **Cronograma interno é privado.** O cliente vê apenas marcos marcados como "visível ao cliente", nunca a lista completa de atividades.
- **Tarefas ≠ Atividades.** Atividades = blocos macro do Gantt com dependências. Tarefas = itens granulares de execução no Kanban. Tarefa pode estar vinculada a uma atividade, mas não obrigatoriamente.
- **IA adiada pelo Danilo até ter chave Anthropic** — código da Fase 4 permanece; UI de IA fica oculta sem a chave.

## Como o Danilo trabalha
- Profissional criativo, **não técnico**, com TDAH.
- Comunicação em **PT-BR direto**, sem jargão de programação. Quando termo técnico for indispensável, explicar em 1 linha.
- O Cursor / Claude Code tem **autonomia técnica total**: instala dependências, cria arquivos, configura ferramentas, faz commits — e avisa depois em linguagem simples.
- No final de cada etapa: **resumo em 3-5 bullets** do que aconteceu, sem jargão.
- Decisão técnica entre opções equivalentes: o Cursor decide e justifica em 1 linha. Não sobrecarregar o Danilo com escolhas técnicas.
- **Todo prompt novo no Cursor deve começar lendo este `CONTEXTO.md`** para evitar mistura com outros projetos do Estúdio 33.

## Status
- [x] Briefing aprovado
- [x] Estrutura de pastas criada
- [x] Identidade visual definida — Hub · E33 Dark ([docs/mockups/hub.html](docs/mockups/hub.html) + [docs/identidade-visual.md](docs/identidade-visual.md))
- [x] Setup técnico — Next 16 + Tailwind 4 + shadcn/ui + Supabase SDKs + tokens E33 aplicados ([docs/arquitetura.md](docs/arquitetura.md))
- [x] **Fase 1 implementada** — auth, CRUD clientes, CRUD projetos, timer de horas, dashboard
- [x] **Fase 2 implementada** — Gantt, templates, alertas
- [x] **Fase 3 implementada** — entregáveis, portal, financeiro
- [x] **Fase 4 implementada (código)** — IA + webhook; uso opcional
- [x] PRD da Fase 5 ([prds/fase-5-tarefas-kanban.md](prds/fase-5-tarefas-kanban.md))
- [x] **Fase 5 implementada** — Kanban de tarefas, briefing no projeto, KPI entregáveis pendentes
- [x] PRD da Fase 6 ([prds/fase-6-operacao-diaria.md](prds/fase-6-operacao-diaria.md))
- [x] **Fase 6 implementada** — views na lista de projetos, progresso %, atividade recente, financeiro com totais
- [x] **Fase 7 implementada** — links no projeto, histórico de projetos no cliente, pagamento no projeto, /settings taxa horária
- [x] PRD da Fase 8 ([prds/fase-8-plano-entregas-portal-fases.md](prds/fase-8-plano-entregas-portal-fases.md))
- [x] **Fase 8 implementada** — área E33, plano de entregas ↔ cronograma, templates Branding/Conteúdo, portal com fases

## Como rodar localmente
1. `npm install` (já feito)
2. `cp .env.local.example .env.local` e preencher com chaves do seu projeto Supabase (ver [supabase/README.md](supabase/README.md))
3. Aplicar as migrations em `supabase/migrations/` no SQL Editor do Supabase (ordem cronológica dos arquivos `20260518*.sql`)
4. Criar um usuário admin no painel Auth do Supabase (e-mail + senha)
5. `npm run dev` → abre em **http://127.0.0.1:3333** (porta fixa 3333 — evita conflito com outros projetos na 3000)
6. Login em **http://127.0.0.1:3333/login** com o usuário criado

## Dados demo
- Seed opcional: `supabase/migrations/20260519120000_demo_panorama_seed.sql` — prefixo `[DEMO]` em clientes/projetos.

## Próximo passo (publicação)
1. Seguir **[docs/deploy.md](docs/deploy.md)** — migrations, Vercel, Resend, testes
2. Na ficha do cliente: **Convidar ao portal** (substitui colar UUID manual)
3. Configurar `NEXT_PUBLIC_APP_URL`, `RESEND_*`, `HUB_ADMIN_EMAIL` na Vercel
4. (Opcional) Seed demo — só em ambiente de teste
5. IA: `ANTHROPIC_API_KEY` quando quiser ativar insights
