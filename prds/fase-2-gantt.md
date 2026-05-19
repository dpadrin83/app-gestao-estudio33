# PRD — Hub Estúdio 33, Fase 2 (Cronograma Gantt)

> Gerado em 2026-05-18. Implementação iniciada nesta sessão.

## Objetivo

Entregar o cronograma com atividades, dependências Finish-to-Start, recálculo automático (forward scheduling) e templates por tipo de projeto. Visão por projeto + visão global. Base para alertas de prazo na Fase 4.

## Escopo desta fase

### Incluído
- Tabelas `activities`, `activity_dependencies`, `schedule_templates`, `schedule_template_items`
- Função Postgres `recalculate_project_schedule(project_id)` — recálculo no banco, não no client
- CRUD de atividades por projeto (criar, editar, excluir, marcar status)
- Dependências FS + `lag_days` entre atividades do mesmo projeto
- Aplicar template ao projeto (gera atividades encadeadas a partir da data de início do projeto ou hoje)
- 3 templates seed: Identidade visual, Landing page, Sistema web
- Visão **Cronograma** na página do projeto (tabela + barras horizontais)
- Página global **`/schedule`** — Gantt de todos os projetos ativos
- Status automático **atrasada** ao listar (previsto &lt; hoje e não concluída)
- Alertas simples no dashboard: atividades atrasadas + vencendo em 7 dias

### Fora deste PRD (Fase 2.1+ ou Fase 3)
- Drag & drop no Gantt (mover barra altera datas) — v2 do Gantt
- Zoom dia/semana/mês no gráfico — v2
- Caminho crítico destacado — Fase 4
- Tarefas Kanban (seção 7 do briefing) — não confundir com atividades
- Portal do cliente / marcos visíveis — Fase 3
- Edge Function Supabase — função Postgres basta na v2; Edge quando houver jobs assíncronos

## Modelo de dados

### `activities`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK → projects | |
| phase | text | `planning`, `production`, `review`, `delivery`, `other` |
| kind | text | `activity`, `milestone` — marco tem duração 0 ou 1 |
| name | text NOT NULL | |
| description | text | |
| estimated_duration_days | int NOT NULL DEFAULT 1 | mínimo 1 para activity |
| planned_start_date | date NOT NULL | |
| planned_end_date | date NOT NULL | |
| actual_start_date | date | |
| actual_end_date | date | |
| status | text | `not_started`, `in_progress`, `completed`, `delayed` |
| visible_to_client | boolean DEFAULT false | Fase 3 usa |
| sort_order | int DEFAULT 0 | |

### `activity_dependencies`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| activity_id | uuid FK → activities (sucessora) | |
| predecessor_id | uuid FK → activities | |
| dependency_type | text DEFAULT `FS` | só FS na v1 |
| lag_days | int DEFAULT 0 | |

Constraint: activity e predecessor no mesmo `project_id`. Sem ciclos (validar na action).

### `schedule_templates` + `schedule_template_items`
Template = nome + itens com duração, fase, ordem e índice da predecessora no array (para encadear ao aplicar).

## Recálculo (forward scheduling)

Disparado após: criar/editar atividade (datas ou duração), criar/remover dependência, aplicar template.

Regras (Postgres):
1. Atividade **concluída** (`status = completed` ou `actual_end_date` preenchida): não altera datas previstas.
2. Atividade **iniciada** (`actual_start_date` NOT NULL): não altera `planned_start_date`; pode atualizar `planned_end_date` se duração mudar.
3. Atividade **não iniciada**: `planned_start = MAX(effective_end(predecessor) + lag + 1 dia)`; `planned_end = planned_start + duration - 1`.
4. `effective_end` = `actual_end_date` ?? `planned_end_date`.
5. Dias corridos (sem feriados).

## Rotas novas

- `/schedule` — cronograma global (projetos `in_progress`)
- Projeto `/projects/[id]` — nova seção **Cronograma** (aba visual via anchor, mesma página)

## UX

### Página do projeto — Cronograma
- Botão "Adicionar atividade" + "Aplicar template"
- Tabela: nome, fase, início, fim, duração, status, dependências
- Mini-Gantt: barras proporcionais à timeline do projeto
- Form modal para criar/editar; select de predecessoras ao salvar

### Cronograma global
- Filtro por cliente (select)
- Barras agrupadas por projeto (cor por projeto)
- Lista lateral de alertas (atrasadas / vence em 7 dias)

### Dashboard (incremento)
- Card ou lista: "Atividades em risco" (atrasadas + próximas 7 dias)

## Templates seed

1. **Identidade visual** — briefing, conceito, refinamento, entrega (FS encadeado)
2. **Landing page** — wireframe, design, dev, QA, deploy
3. **Sistema web** — discovery, arquitetura, sprint 1-2, QA, deploy

## Padrões técnicos (herdar Fase 1)

- Server Actions + zod + sonner
- RLS: autenticado = tudo (igual Fase 1)
- PT-BR nas labels
- Gantt: componente React custom (`GanttChart`) — sem lib externa na v1 (controle visual E33)

## Ordem de execução

1. Migration + função recalc + seeds templates
2. Types + schemas + actions
3. Componentes Gantt + activity form
4. Seção cronograma no projeto
5. Página `/schedule` + nav
6. Dashboard alertas
7. Atualizar CONTEXTO.md

## Critérios de aceite

- [ ] Criar 3 atividades com dependência FS e ver datas das sucessoras recalcularem ao mudar a duração da primeira
- [ ] Aplicar template "Landing page" em projeto vazio gera ≥5 atividades encadeadas
- [ ] `/schedule` mostra atividades de todos os projetos em produção
- [ ] Atividade com fim previsto no passado aparece como atrasada
- [ ] `npm run build` sem erros
