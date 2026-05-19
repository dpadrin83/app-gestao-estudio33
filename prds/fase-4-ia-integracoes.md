# PRD — Hub Estúdio 33, Fase 4 (IA e integrações)

> Gerado em 2026-05-18.

## Objetivo

Camada de IA com Claude (Anthropic) para acelerar operação solo: resumos para cliente, sugestão de cronograma, alertas inteligentes e import do Briefing Studio.

## Escopo

### Incluído
- `@anthropic-ai/sdk` + `ANTHROPIC_API_KEY` e `ANTHROPIC_MODEL` (default Sonnet)
- Tabela `ai_generations` — histórico de resumos e sugestões por projeto
- Campo `projects.briefing_notes` — texto do briefing
- **Resumo semanal** — botão na página do projeto; gera 3–5 bullets em PT-BR
- **Sugestão de cronograma** — textarea no cronograma; IA retorna lista; botão “Aplicar ao projeto”
- **Alertas inteligentes** — regras no dashboard + bloco opcional “Insights IA” (1 clique)
- **POST `/api/integrations/briefing-studio`** — importa cliente + projeto + briefing (+ atividades opcionais); protegido por `BRIEFING_STUDIO_SECRET`

### Fora deste PRD
- Cron job automático segunda-feira (manual por enquanto — botão “Gerar resumo”)
- E-mails Resend com resumo
- Upload de arquivos via Briefing Studio

## Critérios de aceite

- [ ] Com `ANTHROPIC_API_KEY` preenchida, gerar resumo em um projeto
- [ ] Sugerir e aplicar cronograma a partir de descrição em texto
- [ ] Dashboard mostra alertas por regra + insights IA sob demanda
- [ ] POST briefing-studio cria projeto quando secret correto
- [ ] `npm run build` OK
