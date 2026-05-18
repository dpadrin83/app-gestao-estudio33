# Briefing — Sistema de Gestão Estúdio 33

## 1. Contexto e identidade

**Nome provisório:** Hub Estúdio 33 (interno)

**Tipo de projeto:** Web app interno para uso do Estúdio 33 — estúdio criativo híbrido (estratégia + design + tech) operado solo pelo Danilo com apoio intensivo de IA.

**Stack obrigatória:** Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Supabase (auth + Postgres + storage + RLS) + Vercel. Construção via Cursor + Claude Code.

**Restrição operacional crítica:** o sistema é para 1 operador interno (Danilo) + N clientes externos com acesso restrito. Não é multi-tenant SaaS, não tem múltiplas equipes internas, não tem perfis intermediários. Qualquer feature que assuma "equipe de 10 pessoas" deve ser descartada ou simplificada.

## 2. Problema que resolve

Hoje a operação do Estúdio 33 vive espalhada entre:
- Briefings em conversas no Claude.ai
- PRDs gerados no Briefing Studio (app interno já existente)
- Projetos sendo construídos no Claude Code (em pastas locais)
- Cronogramas mentais ou em planilhas soltas
- Aprovações com cliente por WhatsApp / email
- Financeiro em planilha separada
- Arquivos no Drive sem versionamento estruturado

Isso gera três dores concretas:
1. **Perda de contexto entre projetos** — abrir um projeto antigo exige garimpar 5 lugares.
2. **Falta de previsibilidade** — sem cronograma com dependências, atrasos cascateiam sem aviso.
3. **Precificação no escuro** — sem orçado x realizado por projeto, é impossível calibrar ticket (hoje R$ 8–20k inicial, com plano de subida) com base em dados.

O Hub é o **sistema de registro único** que conecta briefing → PRD → cronograma → execução → entrega → financeiro, com camada de IA para reduzir o trabalho manual de operar solo.

## 3. Escopo total e fasamento

O sistema completo tem 4 fases de entrega. Cada fase é deployável e usável de forma independente.

### Fase 1 — Núcleo operacional (foundation)
Sem isso o sistema não existe.
- Auth (Danilo admin + clientes externos com login próprio)
- CRUD de Clientes
- CRUD de Projetos (com fases, status, prazos básicos)
- Dashboard mínimo (projetos ativos, atrasados, próximos prazos)
- Estrutura de dados pronta para receber as próximas fases

### Fase 2 — Cronograma Gantt com dependências
O coração do sistema.
- Atividades com dependências e recálculo automático (forward scheduling)
- Templates de cronograma por tipo de projeto
- Visão por projeto + visão global
- Status de cada atividade (não iniciada, em andamento, concluída, atrasada)
- Alertas de risco de prazo

### Fase 3 — Entregáveis, Portal do Cliente e Financeiro
Fecha o loop com o cliente e com a operação.
- Entregáveis com versionamento e status de aprovação
- Portal do cliente (login próprio, vê só seus projetos)
- Aprovação / reprovação / comentários do cliente
- Financeiro orçado x realizado por projeto
- Time tracking simples (registrar horas por atividade)

### Fase 4 — Camada de IA e integrações
Diferencial competitivo do sistema.
- Resumos de status gerados por IA (semanal por projeto)
- Sugestão automática de cronograma a partir do tipo de projeto
- Alertas inteligentes (não só prazo — também detecção de padrões: "esse tipo de projeto costuma atrasar nessa fase")
- Integração com Briefing Studio (importar PRD → criar projeto automaticamente)

## 4. Personas e perfis de acesso

Apenas 2 perfis:

**Admin (Danilo)**
- Acesso total a tudo
- Único usuário interno
- Cria projetos, clientes, atividades, entregáveis
- Aprova ou rejeita feedback de cliente

**Cliente**
- Login próprio (email + senha via Supabase Auth)
- Vê apenas projetos vinculados a ele (RLS no Supabase)
- Pode: visualizar status, baixar entregáveis, aprovar/reprovar/comentar
- Não pode: ver financeiro, cronograma interno completo (vê marcos de cliente, não atividades internas), outros clientes

**Decisão:** RLS no Supabase é mandatório desde o início para garantir isolamento de dados entre clientes.

## 5. Telas e módulos detalhados

### 5.1 Dashboard (Admin)
Cards superiores:
- Projetos ativos / Projetos concluídos no mês
- Projetos em risco (atividade crítica atrasada ou próxima do prazo)
- Entregáveis aguardando feedback do cliente
- Faturamento do mês (realizado) + previsão (a faturar)
- Horas trabalhadas na semana (do time tracking)

Listas:
- Próximas 7 atividades a vencer (do Gantt global)
- Últimas movimentações dos clientes (aprovações, comentários)

Não inclui: capacidade x carga de equipe (irrelevante para operador solo).

### 5.2 Clientes
Lista simples + ficha individual.

Ficha do cliente:
- Dados da empresa (nome, CNPJ opcional, segmento, porte)
- Contatos (nome, cargo, email, telefone, WhatsApp)
- Status do relacionamento (prospect, ativo, em pausa, encerrado)
- Histórico de projetos (lista clicável)
- Histórico de propostas enviadas (opcional, fase 3+)
- Anotações livres (campo markdown)

Não é um CRM de funil de vendas. É um cadastro com histórico.

### 5.3 Projetos

**Lista de projetos** — tabela com:
- Nome, Cliente, Tipo, Status, Início, Término previsto, Progresso (%), Orçamento

Filtros: por cliente, status, período, tipo.

Views salvas: "Ativos", "Em risco", "Concluídos", "Em proposta".

**Página do projeto** — abas:

1. **Resumo** — status, cliente, prazo, orçamento, progresso, responsável (sempre Danilo na v1), descrição curta.

2. **Briefing** — campos estruturados + anexos + link para o PRD original (se gerado no Briefing Studio).

3. **Cronograma** — Gantt filtrado do projeto. Ver seção 6.

4. **Tarefas** — lista de tarefas ligadas ao projeto (separadas do Gantt — ver seção 7).

5. **Entregáveis** — itens com versão, link de arquivo, status de aprovação.

6. **Financeiro** — orçado x realizado, custos lançados, horas registradas, margem calculada.

7. **Arquivos** — uploads ou links (Drive, Figma, GitHub) organizados.

8. **Atividade** — log do que aconteceu (mudanças de status, comentários do cliente, aprovações).

### 5.4 Cronograma global
Gantt consolidado de todos os projetos ativos. Ver seção 6.

### 5.5 Financeiro global
- Faturamento por mês (gráfico de barras)
- Top 5 clientes por receita
- Projetos com maior desvio de custo (alerta de margem comprometida)
- Ticket médio por tipo de projeto

### 5.6 Portal do Cliente
Login separado. Layout simplificado.

Telas:
- Lista de "meus projetos" (status, próximo marco visível ao cliente)
- Página do projeto (versão cliente): resumo + marcos visíveis + entregáveis para aprovação
- Aprovação: ver entregável, aprovar / reprovar com comentário, ver histórico de versões

Crítico: o cliente NÃO vê o cronograma interno completo. Vê apenas **marcos** que o admin marcou como "visível ao cliente".

## 6. Módulo Cronograma Gantt — especificação detalhada

Esta é a feature central. Detalhamento técnico abaixo.

### 6.1 Modelo de dados

Tabela `atividades`:
- `id` (uuid)
- `projeto_id` (fk)
- `fase` (enum: planejamento, produção, revisão, entrega, customizável)
- `tipo` (enum: atividade, marco)
- `nome` (string)
- `descricao` (text, opcional)
- `duracao_estimada_dias` (int)
- `data_inicio_prevista` (date)
- `data_termino_prevista` (date)
- `data_inicio_real` (date, nullable)
- `data_termino_real` (date, nullable)
- `responsavel_id` (fk, default Danilo)
- `status` (enum: não iniciada, em andamento, concluída, atrasada)
- `visivel_cliente` (boolean)
- `ordem` (int, para drag & drop)

Tabela `dependencias_atividades`:
- `atividade_id` (fk)
- `predecessora_id` (fk)
- `tipo_dependencia` (enum: FS — Finish-to-Start, padrão; outras podem entrar depois)
- `lag_dias` (int, default 0)

### 6.2 Lógica de recálculo (forward scheduling)

Toda vez que uma atividade muda `data_termino_real`, `data_termino_prevista` ou `duracao_estimada_dias`, dispara recálculo das dependentes.

Pseudo-algoritmo:

```
para cada atividade A modificada:
  encontra todas as atividades B que dependem direta ou indiretamente de A
  ordena B por profundidade na cadeia de dependências (BFS)
  para cada B em ordem:
    nova_data_inicio = max(data_termino de cada predecessora) + lag + 1
    nova_data_termino = nova_data_inicio + duracao_estimada - 1
    atualiza B (apenas se data_inicio_real ainda for nula — não mexe em atividades já iniciadas)
```

Regras de exceção:
- Atividade já **iniciada** (tem `data_inicio_real`): não recalcula data de início, apenas avisa se cadeia foi impactada.
- Atividade **concluída**: nunca recalcula.
- Final de semana / feriado: na v1, ignora (conta dias corridos). Suporte a dias úteis fica para v2.

### 6.3 UX do Gantt

Tecnologia sugerida: avaliar `frappe-gantt`, `dhtmlx-gantt` (free tier) ou implementação custom em SVG. Decisão final no PRD técnico.

Funcionalidades mínimas:
- Barras horizontais por atividade
- Linhas conectando dependências
- Drag horizontal para mover atividade (com recálculo de dependentes)
- Drag nas bordas para alterar duração
- Zoom: dia / semana / mês / trimestre
- Cores por status
- Destaque visual para caminho crítico (fase 4 — não é mandatório no v1 do Gantt)
- Filtros: por projeto, por cliente, por responsável, por fase, por período

### 6.4 Templates de cronograma

Cadastro de templates por **tipo de projeto** (ex: "Identidade visual", "Vídeo institucional", "Landing page", "Sistema web"). Cada template tem lista pré-configurada de atividades com durações e dependências.

Ao criar projeto novo: o usuário escolhe um template e o sistema gera todas as atividades já encadeadas. Dali ajusta o que precisar.

## 7. Tarefas vs Atividades — distinção importante

**Atividades** (do Gantt): blocos macro do projeto, com duração, dependências, vão para o cronograma. Ex: "Roteiro", "Edição", "Aprovação cliente".

**Tarefas**: itens granulares de execução do dia a dia, sem dependências formais. Ex: "Pesquisar referências de motion", "Fazer call com cliente sobre tom de voz".

Tarefas podem (opcionalmente) ser vinculadas a uma atividade do Gantt — útil para saber o que está sendo feito dentro de cada bloco do cronograma.

Modelo Kanban simples (a fazer / fazendo / feito) por projeto.

## 8. Entregáveis e versionamento

Cada entregável tem:
- Nome, tipo (vídeo, arte, doc, código, link)
- Projeto vinculado
- Versão atual + histórico de versões anteriores
- Arquivo (upload no Supabase Storage) ou link externo
- Status: rascunho, em revisão interna, enviado ao cliente, aprovado, reprovado
- Histórico de comentários do cliente (timestamped)
- Atividade do Gantt à qual está vinculado (opcional)

Quando admin marca como "enviado ao cliente":
- Notificação por email para o cliente
- Aparece no portal dele

Quando cliente aprova ou reprova:
- Notificação por email para o admin
- Log na linha do tempo do projeto

## 9. Financeiro

Por projeto:
- Orçamento aprovado (valor fechado com cliente)
- Custos lançados (manualmente: ex: freelancer contratado, licença de software, stock footage)
- Horas registradas (via time tracking) × custo/hora padrão (configurável no settings)
- Margem calculada = orçamento − custos − (horas × custo/hora)
- Status de pagamento (a faturar, faturado, recebido)

Visão geral:
- Faturamento por mês
- Projetos com margem abaixo de X%
- Ticket médio por tipo de projeto (alimenta decisões de precificação)

## 10. Time tracking simples

Registro de horas por atividade:
- Botão "iniciar timer" em qualquer atividade do Gantt
- Ou registro manual: data + atividade + horas + descrição curta
- Relatório de horas por projeto / por semana
- Alimenta o cálculo de margem do financeiro

Não é Toggl. É algo enxuto, suficiente para calibrar pricing.

## 11. Camada de IA (Fase 4)

Integração com Claude API (Sonnet 4 ou Opus, configurável).

Funcionalidades:

**Resumo semanal de status por projeto**
- Roda toda segunda-feira de manhã
- Olha últimas atividades, atrasos, aprovações pendentes
- Gera resumo em 3-5 bullets pronto para enviar ao cliente

**Sugestão de cronograma**
- Ao criar projeto novo sem template, descrever em texto livre "é um projeto de X para cliente Y, com prazo de Z"
- IA sugere lista inicial de atividades com durações
- Admin revisa, ajusta, aceita

**Alertas inteligentes**
- "Projeto X está na fase de revisão há 6 dias. Esse tipo de projeto costuma travar aqui — quer um lembrete para o cliente?"
- "Atividade Y está marcada como concluída mas não tem entregável vinculado. Esqueceu de subir o arquivo?"

**Integração com Briefing Studio**
- Endpoint que recebe PRD gerado no Briefing Studio
- Cria projeto automaticamente com cliente, briefing, e cronograma sugerido por IA

## 12. Regras e automações

- Mudança de status de projeto (planejamento → produção etc.) é manual, mas pode disparar email para cliente se configurado.
- Entregável marcado como "enviado ao cliente" → email automático para o cliente.
- Atividade atrasada (data prevista < hoje e status != concluída) → muda status para "atrasada" automaticamente e dispara recálculo das dependentes.
- Custo lançado em projeto → atualiza margem em tempo real.
- Cliente comenta em entregável → email para admin.

## 13. Stack técnica detalhada

- **Frontend:** Next.js 14+ App Router, React 18, TypeScript strict, Tailwind, shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + RLS)
- **Edge functions:** Supabase Edge Functions para recálculo de Gantt e jobs de IA
- **IA:** Anthropic API (Claude Sonnet 4 default)
- **Email:** Resend
- **Deploy:** Vercel
- **Versionamento:** GitHub

Decisão de arquitetura: lógica de recálculo de Gantt fica no banco (função Postgres) + Edge Function para orquestração. Não roda no client.

## 14. Critérios de sucesso

O sistema é considerado bem-sucedido quando:

1. Danilo abandona Notion/planilhas e opera 100% no Hub
2. Tempo de criação de um novo projeto cai de 30min (Tally + Notion + planilha) para 5min (template + ajustes)
3. Em 2 meses de uso, Danilo consegue olhar histórico real de horas vs orçamento e recalibrar pricing
4. Clientes aprovam entregáveis pelo portal (não mais por WhatsApp)
5. Nenhuma entrega passa do prazo sem que o sistema tenha avisado com antecedência

## 15. Fora de escopo (não construir agora)

- App mobile nativo (web responsivo é suficiente)
- Integrações com Slack, Notion, Asana
- Múltiplos usuários internos / colaboração em tempo real
- Marketplace de freelancers
- Funil de CRM (prospecção, propostas, follow-ups automatizados)
- White-label para vender a outros estúdios
- Faturamento / emissão de NF (continua em ferramenta externa)
- Assinatura eletrônica de contratos

Esses itens entram em backlog para v2+ se o sistema provar valor.

## 16. Próximo passo para o dev (Claude Code)

Construir na ordem das fases. Cada fase termina com deploy funcional na Vercel + uso real pelo Danilo antes de iniciar a próxima.

Fase 1 (foundation) é o PRD #1 a ser gerado a partir deste briefing. Quando concluída, gerar PRD #2 para fase 2, e assim por diante.

Importante: cada PRD deve forçar leitura do `CONTEXTO.md` do projeto na primeira mensagem do Claude Code para evitar mistura com outros projetos do Estúdio 33.
