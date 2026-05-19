# PRD — Hub Estúdio 33, Fase 7

## Objetivo

Fechar lacunas do briefing sem APIs externas: histórico de projetos no cliente, links/arquivos no projeto, pagamento no cadastro do projeto e configuração da taxa/hora.

## Escopo

- `project_links` — nome, URL, tipo (Drive, Figma, GitHub, etc.)
- Seção **Links e arquivos** na página do projeto
- **Projetos do cliente** na ficha do cliente
- Campo **Status de pagamento** no formulário do projeto
- Página **/settings** — taxa horária (R$/h) usada no financeiro

## Critérios de aceite

- [ ] CRUD de links no projeto
- [ ] Cliente mostra lista de projetos
- [ ] Pagamento salva no projeto
- [ ] Settings altera hourly_rate
- [ ] `npm run build` OK
