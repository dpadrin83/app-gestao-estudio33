# PRD — Hub Estúdio 33, Fase 6 (Operação diária)

> Sem APIs externas (IA/Resend continuam opcionais).

## Objetivo

Melhorar o dia a dia do Danilo: views rápidas na lista de projetos, progresso visível, histórico de atividade no projeto e resumo financeiro global.

## Escopo

- Views salvas em Projetos: **Ativos**, **Em risco**, **Concluídos**, **Todos**
- Coluna **Progresso** (% atividades concluídas no cronograma)
- Filtro **Em risco** (atividade atrasada ou vence em 7 dias)
- Seção **Atividade recente** na página do projeto (comentários, entregáveis, sessões)
- Cards de resumo na página **Financeiro**
- Dashboard: lista de entregáveis aguardando cliente (com link)

## Critérios de aceite

- [ ] Views mudam a lista sem recarregar manualmente
- [ ] Progresso aparece quando há atividades
- [ ] Feed de atividade mostra últimos eventos
- [ ] `npm run build` OK
