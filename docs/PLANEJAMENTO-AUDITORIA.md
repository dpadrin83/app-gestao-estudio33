# Planejamento e auditoria — Hub Estúdio 33

> Documento vivo para validar o que funciona, o que falta e o que priorizar.  
> **Última revisão:** 2026-05-18 · commit de referência: `7258776` · branch: `main`

**Como usar:** marque cada item com `✅` (ok), `❌` (quebrado), `⚠️` (parcial / confuso) ou deixe `[ ]` pendente.  
Teste preferencialmente na **Vercel** (produção), não só local.

---

## 0. Checklist rápido de infra

| Item | Status | Notas |
|------|--------|-------|
| Código no GitHub (`main` = origin) | `[ ]` | |
| Deploy Vercel em dia com `main` | `[ ]` | |
| `NEXT_PUBLIC_SUPABASE_URL` + anon key | `[ ]` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `[ ]` | |
| `NEXT_PUBLIC_APP_URL` (HTTPS prod) | `[ ]` | |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | `[ ]` | Portal / e-mails |
| `HUB_ADMIN_EMAIL` | `[ ]` | Alertas |
| `ANTHROPIC_API_KEY` (opcional) | `[ ]` | IA |
| Migrations até `20260521340000` aplicadas | `[ ]` | Ver seção 1 |

---

## 1. Migrations Supabase (aplicar na ordem)

Marque quando rodou no SQL Editor:

| # | Arquivo | Essencial? | Status | Notas |
|---|---------|------------|--------|-------|
| 1 | `20260518000001_initial_schema.sql` | Sim | `[ ]` | Base |
| 2 | `20260518120000_phase2_gantt.sql` | Sim | `[ ]` | |
| 3 | `20260518180000_phase3_portal_deliverables_finance.sql` | Sim | `[ ]` | |
| 4 | `20260518200000_phase4_ai.sql` | Sim | `[ ]` | |
| 5 | `20260518210000_phase5_tasks.sql` | Sim | `[ ]` | |
| 6 | `20260518220000_client_company_contact.sql` | Sim | `[ ]` | |
| 7 | `20260518230000_phase7_links_payment.sql` | Sim | `[ ]` | |
| 8 | `20260519000000_phase8_service_line_deliverable_plan.sql` | Sim | `[ ]` | |
| 9 | `20260519120000_demo_panorama_seed.sql` | **Não** (só teste) | `[ ]` | Prefixo `[DEMO]` |
| 10 | `20260520100000_project_macro_plan.sql` | Sim | `[ ]` | |
| 11 | `20260520120000_prompt_templates.sql` | Sim | `[ ]` | |
| 12 | `20260520140000_client_logo_url.sql` | Sim | `[ ]` | |
| 13 | `20260520150000_client_portal_background.sql` | Sim | `[ ]` | |
| 14 | `20260520160000_client_services.sql` | Sim | `[ ]` | |
| 15 | `20260520170000_client_assets_storage.sql` | Sim | `[ ]` | Bucket `client-assets` |
| 16 | `20260521100000_gantt_recalc_respect_edits.sql` | Sim | `[ ]` | |
| 17 | `20260521110000_client_access.sql` | Sim | `[ ]` | |
| 18 | `20260521120000_client_access_due_password.sql` | Sim | `[ ]` | |
| 19 | `20260521130000_client_access_unify.sql` | Sim | `[ ]` | |
| 20 | `20260521140000_project_deliverable_plan.sql` | Sim | `[ ]` | |
| 21 | `20260521150000_studio_deliverable_catalog.sql` | Sim | `[ ]` | |
| 22 | `20260521160000_deliverable_catalog_groups.sql` | Sim | `[ ]` | |
| 23 | `20260521180000_seed_onboarding_catalog_steps.sql` | Sim | `[ ]` | Catálogo |
| 24 | `20260521190000_seed_branding_strategy_catalog_steps.sql` | Sim | `[ ]` | |
| 25 | `20260521210000_seed_visual_identity_catalog_steps.sql` | Sim | `[ ]` | |
| 26 | `20260521240000_digital_solutions_detailed_steps.sql` | Sim | `[ ]` | |
| 27 | `20260521250000_digital_client_approval_gates.sql` | Sim | `[ ]` | |
| 28 | `20260521260000_remove_duplicate_empty_catalog_areas.sql` | Sim | `[ ]` | |
| 29 | `20260521270000_seed_content_copy_catalog_steps.sql` | Sim | `[ ]` | |
| 30 | `20260521300000_plan_playbook_and_project_access.sql` | Sim | `[ ]` | Playbook |
| 31 | `20260521310000_gantt_recalc_early_completion.sql` | Sim | `[ ]` | |
| 32 | `20260521320000_finance_phase_a.sql` | Sim | `[ ]` | Datas NF, docs, bucket |
| 33 | `20260521330000_seed_finance_demo.sql` | Opcional | `[ ]` | Só demo |
| 34 | `20260521340000_studio_cash_movements.sql` | Sim | `[ ]` | Lançamentos estúdio |

**Atalho DB nova:** colar `supabase/apply-all.sql` (gerar com `npm run db:bundle`).

---

## 2. Onda A — Smoke test (fluxo completo)

Faça na ordem. Anote erros na coluna Notas.

### Auth e navegação

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| A1 | Login admin | `[ ]` | |
| A2 | Dashboard carrega (Gantt, alertas, atalhos) | `[ ]` | |
| A3 | Menu lateral: todas as rotas abrem | `[ ]` | |
| A4 | Logout / login portal cliente | `[ ]` | |

### Clientes

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| B1 | Listar + filtrar clientes | `[ ]` | |
| B2 | Criar cliente | `[ ]` | |
| B3 | Editar cliente + upload logo | `[ ]` | |
| B4 | Acessos / credenciais do cliente | `[ ]` | |
| B5 | Convidar ao portal (e-mail) | `[ ]` | Precisa Resend |
| B6 | Lista de projetos do cliente | `[ ]` | |

### Projetos — fluxo principal

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| C1 | Criar projeto (formulário completo) | `[ ]` | |
| C2 | Lançar rápido (cliente interno) | `[ ]` | |
| C3 | Views: Ativos / Em risco / Concluídos | `[ ]` | |
| C4 | Timer na lista de projetos | `[ ]` | |
| C5 | Excluir projeto | `[ ]` | |

### Catálogo + plano + cronograma

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| D1 | Catálogo global: 5 áreas visíveis | `[ ]` | |
| D2 | Importar catálogo no plano de entregáveis | `[ ]` | |
| D3 | Publicar plano no cronograma | `[ ]` | |
| D4 | Playbook ao clicar passo do plano | `[ ]` | |
| D5 | Concluir atividade no Gantt | `[ ]` | |
| D6 | Recálculo de datas (dependências) | `[ ]` | |
| D7 | Conclusão antecipada comprime datas | `[ ]` | |
| D8 | Cronograma global `/schedule` | `[ ]` | |

### Entregáveis + portal

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| E1 | Criar entregável + versão | `[ ]` | |
| E2 | Enviar ao cliente | `[ ]` | |
| E3 | Cliente aprova / reprova no portal | `[ ]` | |
| E4 | Fases visíveis no portal | `[ ]` | |

### Financeiro

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| F1 | Projeto → Financeiro: contrato + status + datas | `[ ]` | |
| F2 | Lançar custo no projeto | `[ ]` | |
| F3 | Upload PDF (contrato/NF) | `[ ]` | Bucket `project-finance-docs` |
| F4 | Menu Financeiro: KPIs + gráfico | `[ ]` | |
| F5 | Lançamento estúdio (cartão, sem projeto) | `[ ]` | Migration `213400` |
| F6 | Extrato / movimentações atualiza | `[ ]` | |
| F7 | Export CSV | `[ ]` | |
| F8 | Alterar status na tabela (faturado/recebido) | `[ ]` | |

### Outros módulos

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| G1 | Kanban tarefas | `[ ]` | |
| G2 | Acessos e credenciais do projeto | `[ ]` | |
| G3 | Feed atividade recente | `[ ]` | |
| G4 | Acessos / renovações `/services` | `[ ]` | |
| G5 | Config: taxa horária + alerta margem | `[ ]` | |
| G6 | Banco de prompts `/settings/prompts` | `[ ]` | |
| G7 | IA dashboard (se `ANTHROPIC_API_KEY`) | `[ ]` | |

---

## 3. Inventário por módulo (código vs uso real)

Classifique seu uso: **Diário** · **Ocasional** · **Nunca** · **Preciso e não tenho**

| Módulo | No código | Seu uso | Status teste | Prioridade |
|--------|-----------|---------|--------------|------------|
| Dashboard + portfolio Gantt | OK | `[ ]` | `[ ]` | |
| Clientes | OK | `[ ]` | `[ ]` | |
| Projetos + views | OK | `[ ]` | `[ ]` | |
| Lançar rápido | OK | `[ ]` | `[ ]` | |
| Catálogo E33 | OK | `[ ]` | `[ ]` | |
| Plano de entregáveis | OK | `[ ]` | `[ ]` | |
| Gantt projeto | OK | `[ ]` | `[ ]` | |
| Cronograma global | OK | `[ ]` | `[ ]` | |
| Templates legados (5) | Parcial | `[ ]` | `[ ]` | |
| Entregáveis | OK | `[ ]` | `[ ]` | |
| Portal cliente | OK | `[ ]` | `[ ]` | |
| Kanban tarefas | OK | `[ ]` | `[ ]` | |
| Timer / horas | OK | `[ ]` | `[ ]` | |
| Financeiro projeto | OK | `[ ]` | `[ ]` | |
| Financeiro / fluxo de caixa | OK | `[ ]` | `[ ]` | |
| Lançamentos estúdio | OK* | `[ ]` | `[ ]` | |
| Conciliação bancária | Não | — | — | Backlog |
| Acessos renovações | OK | `[ ]` | `[ ]` | |
| Prompts | OK | `[ ]` | `[ ]` | |
| IA (insights / cronograma) | Parcial | `[ ]` | `[ ]` | |
| Plano macro (área/profissional) | **Não na UI** | `[ ]` | — | Decidir |
| Webhook Briefing Studio | Parcial | `[ ]` | `[ ]` | |

\* Requer migration `20260521340000`.

---

## 4. Lacunas conhecidas (doc vs sistema)

| Item | Situação | Decisão |
|------|----------|---------|
| Conciliação OFX/CSV | Placeholder | `[ ]` Fazer / `[ ] Adiar` |
| Resumo semanal IA na ficha projeto | Código morto | `[ ]` Ligar / `[ ]` Remover |
| Plano macro na ficha projeto | Código morto | `[ ]` Ligar / `[ ]` Remover |
| View "Em proposta" | Não existe | `[ ]` Backlog / `[ ]` Ignorar |
| Histórico propostas cliente | Não existe | `[ ]` Backlog / `[ ]` Ignorar |
| Drag no Gantt | Não (v2) | `[ ]` Backlog / `[ ]` Ignorar |
| Parcelas contrato | Não existe | `[ ]` Backlog |
| `verify-migrations.sql` desatualizado | Docs | `[ ]` Atualizar depois |
| Seed finance demo no bundle prod | Risco | `[ ]` Excluir do bundle |

---

## 5. Backlog sugerido (priorizar depois da Onda A)

Marque prioridade: **P0** (urgente) · **P1** · **P2** · **P3** (nunca)

| # | Item | Prioridade | Esforço | Depende de |
|---|------|------------|---------|------------|
| 1 | Confirmar todas migrations + buckets | | Pequeno | Supabase |
| 2 | Conciliação bancária (import extrato) | | Grande | |
| 3 | Atualizar verify-migrations / PRE-DEPLOY | | Pequeno | |
| 4 | Ligar ou remover plano macro | | Pequeno | Decisão |
| 5 | Ligar ou remover painel IA projeto | | Pequeno | API key |
| 6 | Parcelas / múltiplos recebimentos | | Médio | |
| 7 | Categorias custo por projeto | | Médio | |
| 8 | View "Em proposta" | | Médio | |
| 9 | Drag Gantt | | Grande | |
| 10 | Playbooks Branding/Conteúdo (passos restantes) | | Médio | |

---

## 6. Onde lançar o quê (referência rápida)

| O que | Onde |
|-------|------|
| Recebeu do cliente, custo do job, NF do projeto | **Projeto → aba Financeiro** |
| Cartão, Adobe, aluguel, operacional | **Menu Financeiro → Lançamentos do estúdio** |
| Horas (mão de obra) | **Timer** no cronograma ou lista |
| Ver caixa, extrato, pipeline | **Menu Financeiro** (visualização) |
| Taxa/hora e alerta margem | **Configurações** |

---

## 7. Registro de sessões de auditoria

| Data | O que testou | Problemas encontrados | Próximo passo |
|------|--------------|----------------------|---------------|
| | | | |
| | | | |
| | | | |

---

## 8. Links úteis

- Contexto geral: [`CONTEXTO.md`](../CONTEXTO.md)
- Deploy: [`docs/deploy.md`](deploy.md), [`docs/PRE-DEPLOY.md`](PRE-DEPLOY.md)
- Briefing original: [`briefing-sistema-gestao-e33.md`](../briefing-sistema-gestao-e33.md)
- Preview financeiro estático: [`docs/finance-macro-preview.html`](finance-macro-preview.html)
- Seed finance demo: [`supabase/seed-finance-demo.sql`](../supabase/seed-finance-demo.sql)

---

*Atualize este arquivo conforme for testando. Na próxima sessão com o Cursor, diga: "continuar auditoria — li o PLANEJAMENTO-AUDITORIA.md" e cole o que marcou.*
