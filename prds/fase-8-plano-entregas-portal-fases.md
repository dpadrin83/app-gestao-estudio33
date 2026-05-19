# PRD — Hub Estúdio 33, Fase 8

## Objetivo

Operação completa por **linha de serviço E33**: plano de entregas ligado ao cronograma e **portal do cliente** com acompanhamento de fase (planejamento → entrega).

## Escopo

### Dados
- `projects.service_line` — branding | identity | content | web_design | web_dev | hybrid
- `schedule_templates.service_line` — vínculo template ↔ área
- `schedule_template_deliverables` — entregas padrão por template + `activity_sort_order`
- Ao **aplicar template**: gera atividades + entregáveis em rascunho já vinculados

### Admin
- Campo **Área E33** no projeto
- Abas na página do projeto (navegação por âncora)
- Seção **Plano de entregas** — lista agrupada por fase/atividade, progresso, vínculo com cronograma
- Form entregável: seletor de atividade do cronograma

### Portal cliente
- Lista de projetos: status + **fase atual** + % progresso (marcos/atividades visíveis)
- Detalhe: **stepper de fases** + marcos + entregáveis para aprovação

## Fora de escopo (v8.1+)

- E-mails Resend
- Upload Storage
- CRM de propostas
- Drag no plano de entregas

## Critérios de aceite

- [ ] Migration aplicada
- [ ] Template gera entregáveis vinculados
- [ ] Cliente vê fase e progresso no portal
- [ ] `npm run build` OK
