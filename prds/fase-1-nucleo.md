# PRD — Hub Estúdio 33, Fase 1 (Núcleo operacional)

> Recebido em 2026-05-18. Implementação iniciada nesta sessão.

## Objetivo
Construir o núcleo funcional mínimo do Hub Estúdio 33: auth, CRUD de clientes, CRUD de projetos, timer de horas e dashboard básico. Tudo rodando local, persistindo no Supabase.

## Stack (já configurada)
Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Supabase. Identidade visual já aplicada (ver `docs/mockups/showcase.html`). Manter Geist + Instrument Serif, paleta brand, dark mode forçado, brand-stripe no topo.

## Schema do banco (Supabase)

### tabela: `clients`
- `id` (uuid, pk, default `gen_random_uuid()`)
- `name` (text, not null)
- `email` (text)
- `phone` (text)
- `notes` (text)
- `status` (text, default `'active'`, check in `('active','inactive')`)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)

### tabela: `projects`
- `id` (uuid, pk)
- `client_id` (uuid, fk → `clients.id`, not null)
- `name` (text, not null)
- `description` (text)
- `status` (text, default `'in_progress'`, check in `('in_progress','paused','done','archived')`)
- `start_date` (date)
- `expected_end_date` (date)
- `contract_value` (numeric)
- `created_at`, `updated_at` (timestamptz)

### tabela: `time_sessions`
- `id` (uuid, pk)
- `project_id` (uuid, fk → `projects.id`, not null)
- `started_at` (timestamptz, not null)
- `ended_at` (timestamptz) — null = sessão rodando
- `description` (text)
- `created_at` (timestamptz)

RLS habilitado em todas, com policy permitindo tudo para o usuário autenticado (single user na Fase 1).

## Auth
- Supabase Auth com e-mail/senha
- Tela `/login` simples (sem signup público)
- Middleware redireciona para `/login` se não autenticado
- Rota `/logout`

## Estrutura de rotas
- `/login`
- `/dashboard` (home após login)
- `/clients` (lista)
- `/clients/new`
- `/clients/[id]` (editar)
- `/projects` (lista, com filtros por status e cliente)
- `/projects/new`
- `/projects/[id]` (detalhe + lista de sessões de horas)

## Features

### CRUD Clientes
- Lista em tabela (shadcn Table), com busca por nome
- Form de criar/editar com validação zod
- Soft delete: botão "Inativar" muda status para `'inactive'`, não apaga
- Filtro: só ativos / só inativos / todos

### CRUD Projetos
- Lista em tabela, com filtros: status (multi-select) e cliente (select)
- Form de criar/editar com validação zod
- Página de detalhe mostra: dados do projeto + tabela de `time_sessions`

### Timer de horas
- Na lista de projetos, cada linha tem botão "Iniciar" (ou "Parar" se já tem sessão ativa)
- Ao iniciar: cria `time_session` com `started_at=now()`, `ended_at=null`
- Regra: só uma sessão pode estar ativa (`ended_at` null) por vez. Se iniciar outra, encerra a anterior automaticamente com `ended_at=now()`
- Ao parar: abre modal pedindo a descrição do que foi feito, salva e fecha
- Na página de detalhe do projeto: lista de sessões com editar (corrigir horário/descrição) e deletar

### Dashboard (/dashboard)
3 cards no topo:
- Horas trabalhadas nesta semana (segunda 00:00 a domingo 23:59)
- Horas trabalhadas neste mês
- Quantidade de projetos com status `'in_progress'`

Abaixo, lista "Projetos ativos" com nome do projeto + cliente + total de horas trabalhadas na semana atual em cada um.

## Padrões técnicos
- Server Actions do Next para mutations (não criar API routes)
- Validação com zod em todos os forms
- Toasts de sucesso/erro (sonner)
- Componentes shadcn padrão: Button, Input, Select, Table, Dialog, Card, Badge
- Formatação de horas: "2h 35min" (não decimal)
- Datas em PT-BR (date-fns com locale ptBR)

## O que NÃO fazer
- Não criar propostas, contratos, faturamento, CRM, leads
- Não criar gráficos no dashboard (só números e listas)
- Não criar sistema de tags, categorias, ou labels avançadas
- Não criar notificações nem integrações externas
- Não fazer deploy
- Não criar testes automatizados nessa fase

## Execução — ordem
1. Migrations Supabase (3 tabelas + RLS) + types gerados
2. Auth (login, middleware, logout) + tela `/login` estilizada
3. CRUD de clientes completo
4. CRUD de projetos completo (sem timer ainda)
5. Timer de horas (start/stop + lista de sessões no detalhe)
6. Dashboard com os 3 cards e a lista de projetos ativos
7. Atualizar `CONTEXTO.md` marcando Fase 1 como concluída
