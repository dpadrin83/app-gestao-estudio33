# PRD — Hub Estúdio 33, Fase 3 (Entregáveis, portal do cliente, financeiro)

> Gerado em 2026-05-18. Implementação iniciada nesta sessão.

## Objetivo

Fechar o loop com o cliente: entregáveis versionados com aprovação, portal restrito por RLS, e visão financeira orçado × realizado por projeto.

## Escopo

### Incluído
- `clients.auth_user_id` — vincula login Supabase ao cadastro do cliente
- Tabelas `deliverables`, `deliverable_versions`, `deliverable_comments`, `project_costs`, `app_settings`
- RLS: admin vê tudo; cliente vê só seus projetos, marcos (`visible_to_client`) e entregáveis enviados
- Admin: seção **Entregáveis** na página do projeto (criar, versão com link, enviar ao cliente)
- Admin: seção **Financeiro** no projeto (custos, horas × taxa/hora, margem) + página `/finance`
- Portal `/portal`: meus projetos, detalhe com marcos + entregáveis para aprovar/reprovar + comentário
- Middleware redireciona cliente para `/portal` e bloqueia área admin
- Campo no cliente (admin) para colar UUID do usuário Auth do portal

### Fora deste PRD
- Upload Supabase Storage (v3.1 — usar link externo: Drive, Figma, etc.)
- E-mails Resend (Fase 3.1)
- Tarefas Kanban
- Financeiro global com gráficos
- Log de atividade do projeto (timeline)

## Modelo de dados

### Alteração `clients`
- `auth_user_id` uuid UNIQUE nullable — FK lógica para `auth.users`

### `deliverables`
- `project_id`, `activity_id` (opcional), `name`, `type` (video|design|doc|code|link)
- `status`: draft | internal_review | sent_to_client | approved | rejected

### `deliverable_versions`
- `deliverable_id`, `version_number`, `external_link`, `notes`

### `deliverable_comments`
- `deliverable_id`, `author_role` (admin|client), `body`

### `project_costs`
- `project_id`, `description`, `amount`, `incurred_at`

### `app_settings`
- `hourly_rate` default 150 (BRL)

## Rotas

| Rota | Quem |
|------|------|
| `/portal` | Cliente |
| `/portal/projects/[id]` | Cliente |
| `/finance` | Admin |
| Projeto → Entregáveis / Financeiro | Admin |

## Critérios de aceite

- [ ] Admin cria entregável com link, envia ao cliente
- [ ] Cliente logado vê só seus projetos e aprova/reprova com comentário
- [ ] Cliente não acessa `/dashboard` nem `/finance`
- [ ] Margem do projeto = orçamento − custos − (horas × taxa/hora)
- [ ] `npm run build` sem erros
