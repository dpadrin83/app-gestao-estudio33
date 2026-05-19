# PRDs — Hub Estúdio 33

Esta pasta guarda os **PRDs (Product Requirements Documents) por fase** do Hub.

Cada fase do projeto vira um PRD próprio, que detalha escopo, telas, modelo de dados, critérios de aceite e plano de entrega daquela fase específica.

## Ordem prevista

- `prd-fase-1-nucleo-operacional.md` — auth, clientes, projetos, dashboard mínimo
- [fase-2-gantt.md](fase-2-gantt.md) — cronograma com dependências e recálculo ✅
- [fase-3-entregaveis-portal-financeiro.md](fase-3-entregaveis-portal-financeiro.md) — entregáveis, portal do cliente, financeiro ✅
- `prd-fase-4-ia-integracoes.md` — camada de IA e integração com Briefing Studio

## Regra

Cada PRD é gerado a partir do `briefing.md` + `CONTEXTO.md` (raiz da pasta). Só começa a Fase N+1 depois que a Fase N estiver no ar na Vercel e em uso real pelo Danilo.

Cada PRD deve obrigar a leitura do `CONTEXTO.md` na primeira mensagem do Claude Code, para evitar mistura com outros projetos do Estúdio 33.
