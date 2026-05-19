# PRD — Hub Estúdio 33, Fase 5 (Tarefas Kanban + briefing)

> Gerado em 2026-05-18. IA (Fase 4) fica opcional até o Danilo configurar `ANTHROPIC_API_KEY`.

## Objetivo

Tarefas granulares do dia a dia (separadas do Gantt), em Kanban por projeto, mais campo de briefing no cadastro do projeto.

## Escopo

### Incluído
- Tabela `tasks` — `todo` | `doing` | `done`, vínculo opcional com `activities`
- RLS: só admin (mesmo padrão das demais tabelas internas)
- Seção **Tarefas** na página do projeto (3 colunas)
- Campo **Briefing** no formulário do projeto (`briefing_notes`)
- Dashboard: contador de entregáveis aguardando feedback do cliente
- UI de IA oculta quando não há `ANTHROPIC_API_KEY`

### Fora deste PRD
- E-mails Resend (precisa `RESEND_API_KEY`)
- Drag-and-drop entre colunas (v5.1 — botões mover status)
- Tarefas visíveis ao cliente

## Critérios de aceite

- [ ] Criar, mover e concluir tarefas em um projeto
- [ ] Vincular tarefa a uma atividade do cronograma (opcional)
- [ ] Salvar texto de briefing no projeto
- [ ] Dashboard mostra entregáveis pendentes do cliente
- [ ] `npm run build` OK
