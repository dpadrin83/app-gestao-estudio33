# CONTEXTO — Hub Estúdio 33

> **Porta de entrada do projeto.** Todo prompt novo no Cursor / Claude Code deve começar lendo este arquivo antes de qualquer outra coisa. Ele evita mistura com outros projetos do Estúdio 33.

## Identidade do projeto
- **Nome:** Hub Estúdio 33
- **Tipo:** Web app interno (uso solo + IA, com acesso restrito de clientes externos)
- **Cliente:** Estúdio 33 (uso próprio do Danilo)
- **Status atual:** Fase 1 implementada (auth + CRUD clientes + CRUD projetos + timer + dashboard) — falta só conectar ao Supabase real (criar projeto + aplicar migration + criar usuário admin) para usar.

## Stack
Next.js 14+ (App Router) · React 18 · TypeScript strict · Tailwind · shadcn/ui · Supabase (auth + Postgres + storage + RLS + edge functions) · Vercel · Resend · Anthropic API (Claude Sonnet 4 default)

Versionamento: GitHub. Construção: Cursor + Claude Code.

## Estrutura de fases
Cada fase é deployável e usável de forma independente. Não pular fase.

- **Fase 1 — Núcleo operacional:** auth (admin + cliente), CRUD de clientes, CRUD de projetos, dashboard mínimo, estrutura de dados pronta pras próximas fases.
- **Fase 2 — Gantt com dependências:** atividades com dependências, recálculo automático (forward scheduling), templates por tipo de projeto, visão por projeto + global, alertas de risco.
- **Fase 3 — Entregáveis, portal do cliente, financeiro, time tracking:** versionamento de entregáveis, portal do cliente com aprovação, orçado x realizado, registro de horas.
- **Fase 4 — Camada de IA e integrações:** resumos semanais por IA, sugestão de cronograma, alertas inteligentes, integração com o Briefing Studio.

## Decisões já tomadas
- **RLS no Supabase desde o início.** Não é opcional. Cliente externo só enxerga os próprios projetos via Row Level Security.
- **Apenas 2 perfis:** admin (Danilo, único usuário interno) e cliente (acesso restrito). Sem perfis intermediários, sem múltiplas equipes internas.
- **Não é multi-tenant SaaS.** É um sistema interno de 1 operador + N clientes. Qualquer feature que assuma "equipe de 10 pessoas" é descartada ou simplificada.
- **Autonomia técnica total do Cursor / Claude Code.** Faz e avisa em PT-BR simples. Não pede permissão para decisões técnicas — decide e justifica em 1 linha.
- **Fasamento obrigatório.** Cada fase deploya na Vercel e é usada de verdade pelo Danilo antes da próxima começar. Sem isso, vira sistema fantasma.
- **Lógica de recálculo do Gantt roda no banco** (função Postgres + Edge Function), não no client.
- **Cronograma interno é privado.** O cliente vê apenas marcos marcados como "visível ao cliente", nunca a lista completa de atividades.
- **Tarefas ≠ Atividades.** Atividades = blocos macro do Gantt com dependências. Tarefas = itens granulares de execução no Kanban. Tarefa pode estar vinculada a uma atividade, mas não obrigatoriamente.

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
- [x] PRD da Fase 1 ([prds/fase-1-nucleo.md](prds/fase-1-nucleo.md))
- [x] **Fase 1 implementada** — auth, CRUD clientes, CRUD projetos, timer de horas, dashboard

## Como rodar localmente
1. `npm install` (já feito)
2. `cp .env.local.example .env.local` e preencher com chaves do seu projeto Supabase (ver [supabase/README.md](supabase/README.md))
3. Aplicar a migration `supabase/migrations/20260518000001_initial_schema.sql` no dashboard do Supabase
4. Criar um usuário admin no painel Auth do Supabase (e-mail + senha)
5. `npm run dev` → abre em http://localhost:3000 (ou 3030 se a 3000 estiver ocupada)
6. Login em `/login` com o usuário criado

## Próximo passo
Conectar o Supabase real:
1. Criar projeto em https://supabase.com (região São Paulo)
2. Aplicar a migration
3. Adicionar `.env.local` com as chaves
4. Criar o usuário admin

Quando estiver no ar, validar todo o fluxo (criar cliente → criar projeto → iniciar timer → encerrar com descrição → ver dashboard).
