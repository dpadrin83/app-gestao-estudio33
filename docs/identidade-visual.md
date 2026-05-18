# Identidade Visual — Hub Estúdio 33 (3 direções)

> Rascunho para decisão. Nenhuma destas é "a certa" — são três personalidades genuinamente diferentes. O objetivo é provocar uma escolha consciente, não vender. Leia com calma. No fim do doc tem 4 perguntas que ajudam a decidir.

Os três eixos em que essas direções se separam:

| Eixo | Bureau (1) | Hangar (2) | Atelier (3) |
|---|---|---|---|
| Tom | Editorial sóbrio | Técnico denso | Expressivo tátil |
| Modo padrão (admin) | Claro | Escuro | Híbrido com personalidade |
| Tipografia protagonista | Serif editorial | Mono | Serif display + sans |
| Cor | Neutros + 1 accent terroso | Neutros frios + 1 accent elétrico | Paleta dessaturada multi-tom |
| Densidade | Comfortable | Compact | Misto |

---

## 1. Bureau — Editorial Sóbrio

### Conceito
Um caderno de estúdio bem encadernado. Tom de papel cru, tinta escura, hierarquia tipográfica forte. A informação aparece com calma, com espaço entre as coisas. Lembra um jornal premium ou um livro de arquitetura mais do que um app de SaaS. É o tipo de interface que envelhece bem e não cansa em sessões de 4 horas. Conversa com o lado mais maduro do Estúdio 33 — o que cobra ticket médio-alto e entrega coisa pensada.

### Referências
- **Things 3** — https://culturedcode.com/things/ — sobriedade, papel claro, tipografia respirada
- **Stripe Docs** — https://docs.stripe.com — densidade controlada com calma editorial
- **The Browser Company / Arc Site** — https://arc.net — tipografia generosa, peso editorial moderno

### Paleta de cores (HSL, formato shadcn)

**Modo claro (padrão)**
```
background:            40 30% 97%
foreground:            30 12% 12%
card:                  40 30% 99%
card-foreground:       30 12% 12%
popover:               40 30% 99%
popover-foreground:    30 12% 12%
primary:               18 50% 35%   /* terracota escuro — único accent forte */
primary-foreground:    40 30% 97%
secondary:             36 15% 90%
secondary-foreground:  30 12% 18%
muted:                 36 15% 92%
muted-foreground:      30 10% 40%
accent:                36 22% 85%
accent-foreground:     30 12% 18%
destructive:           0 65% 45%
destructive-foreground:40 30% 97%
border:                36 15% 85%
input:                 36 15% 88%
ring:                  18 50% 45%
success:               140 35% 35%
warning:               32 75% 50%
info:                  210 30% 45%
```

**Modo escuro (opcional, alternativo)**
```
background:            28 8% 10%
foreground:            36 18% 92%
card:                  28 8% 13%
card-foreground:       36 18% 92%
popover:               28 8% 13%
popover-foreground:    36 18% 92%
primary:               22 60% 55%
primary-foreground:    28 8% 8%
secondary:             28 8% 18%
secondary-foreground:  36 18% 88%
muted:                 28 8% 18%
muted-foreground:      36 12% 60%
accent:                28 8% 22%
accent-foreground:     36 18% 88%
destructive:           0 55% 50%
destructive-foreground:36 18% 95%
border:                28 8% 22%
input:                 28 8% 18%
ring:                  22 60% 55%
success:               140 30% 50%
warning:               32 75% 60%
info:                  210 35% 60%
```

### Tipografia
- **Principal (títulos/marcas editoriais):** Fraunces — https://fonts.google.com/specimen/Fraunces — pesos 400, 500, 600. Serif moderna com personalidade, mas calma.
- **Corpo (UI, parágrafos, labels):** Inter — https://fonts.google.com/specimen/Inter — pesos 400, 500, 600. Sans humanista neutra, muito legível em corpo pequeno.
- **Mono (números, horas, datas, IDs):** JetBrains Mono — https://fonts.google.com/specimen/JetBrains+Mono — peso 400, 500.
- **Escala:**
  - text-xs 12px · text-sm 14px · text-base 16px · text-lg 18px
  - text-xl 20px · text-2xl 24px · text-3xl 30px · text-4xl 36px · text-5xl 48px
- **Letter-spacing:** títulos em Fraunces com tracking levemente negativo (-0.01em). Corpo em Inter neutro.
- **Line-height:** generoso — 1.6 para corpo, 1.2 para títulos. Tem ar entre as linhas, é editorial.

### Densidade
**Comfortable.** Em linguagem prática: tabelas mostram cerca de **18 a 22 linhas por tela** em vez das 30+ de um app denso. Cards têm mais respiro interno (24px de padding). É menos informação por tela, mas a fadiga visual em 4-6 horas é menor — você lê com calma. Não é a melhor escolha se o objetivo for "ver o máximo de projetos de uma vez".

### Tratamento dos elementos-chave
- **Card:** fundo `card`, borda fina 1px na cor `border`, raio 8px, sombra **quase imperceptível** (apenas separação). Padding interno 24px. Sem hover dramático.
- **Tabela:** **sem zebra**. Linhas separadas só por uma borda inferior 1px `border`. Header em Inter 500, 12px, letter-spacing 0.04em, cor `muted-foreground`. Linha de 48px de altura. Hover muda só o fundo para `secondary`.
- **Badges de status:**
  - Rascunho: fundo `muted`, texto `muted-foreground`
  - Em andamento: fundo `info` 15% opacidade, texto `info`
  - Atrasado: fundo `warning` 15%, texto `warning` escuro
  - Concluído / Aprovado: fundo `success` 15%, texto `success` escuro
  - Reprovado: fundo `destructive` 15%, texto `destructive`
  - Todos: pílula com raio 4px, 11px, peso 500, padding 4×10px
- **Botões:**
  - Primário: fundo `primary` (terracota), texto `primary-foreground`, peso 500, sem sombra
  - Secundário: fundo `secondary`, texto `secondary-foreground`
  - Destrutivo: fundo `destructive`
  - Ghost: transparente, hover `secondary`
  - Todos com raio 6px, altura 36px (default) / 32px (sm) / 44px (lg)
- **Barra do Gantt:** altura 28px, raio 4px, cor lateral 4px sólida indicando fase. Label da atividade dentro da barra se couber, à direita se não. Cores por status seguem o mapa dos badges.
- **Avatar do cliente:** círculo 32px, foto se houver, senão iniciais em Fraunces 14px sobre fundo gerado a partir do nome (matiz fixo por cliente).
- **Sidebar:** 240px, fundo `background`, divisor 1px `border`. Itens em Inter 14px com ícone à esquerda. Item ativo: barra 2px à esquerda em `primary` + fundo `secondary`.

### Layout base
Sidebar à esquerda fixa (240px). Topbar discreta (56px) só com breadcrumb e ações contextuais. Conteúdo com largura máxima de 1400px e margens generosas (tipo livro aberto). Portal do cliente: **sem sidebar**, hero editorial com nome do projeto em Fraunces 48px, navegação mínima em pílulas no topo. Visualmente quieto, profissional.

### Modo claro vs escuro
- **Admin:** modo claro como padrão. Modo escuro existe mas é alternativo (algumas pessoas preferem à noite).
- **Portal do cliente:** sempre modo claro. Transmite seriedade, lembra papel impresso. Cliente abre uma vez, não passa horas dentro.

### Pontos fortes para o Hub
- Não cansa em sessões longas — o branco-cru e o respiro tipográfico são gentis com a vista.
- O portal do cliente parece um documento impresso de estúdio, não um app. Reforça posicionamento de ticket mais alto.
- Envelhece bem. Daqui a 3 anos não vai parecer datado.
- Combina com um estúdio criativo que vende pensamento, não "tech".

### Trade-offs
- Densidade comfortable significa **menos linhas por tela** — pode incomodar quando você quiser ver 50 atividades de uma vez no Gantt.
- O accent terracota é único e forte — se você cansar dele em 6 meses, mudar paleta exige retrabalho.
- Direção menos "wow" no primeiro segundo. Não causa o efeito imediato de um Linear escuro. É beleza que aparece com convivência.

---

## 2. Hangar — Técnico Denso

### Conceito
Uma oficina técnica de precisão. Modo escuro nativo, monoespaçada como protagonista (números, datas e horas viram personagem visual), accent elétrico usado com economia. Cada pixel trabalha — densidade máxima, atalho de teclado em tudo, comandbar tipo terminal. É o tipo de interface que sinaliza "o operador aqui sabe o que está fazendo". Conversa com a parte do Estúdio 33 que entrega tech e quer transmitir competência operacional.

### Referências
- **Linear** — https://linear.app — densidade calibrada, escuro, mono nos detalhes, cmdbar
- **Vercel** — https://vercel.com — preto/branco com accent, mono em métricas
- **Raycast** — https://raycast.com — comandbar, atalhos, estética terminal moderna

### Paleta de cores (HSL, formato shadcn)

**Modo escuro (padrão pro admin)**
```
background:            220 14% 8%
foreground:            220 8% 92%
card:                  220 14% 10%
card-foreground:       220 8% 92%
popover:               220 14% 10%
popover-foreground:    220 8% 92%
primary:               175 80% 50%   /* ciano elétrico — accent único e parcimonioso */
primary-foreground:    220 14% 8%
secondary:             220 14% 16%
secondary-foreground:  220 8% 90%
muted:                 220 14% 14%
muted-foreground:      220 6% 58%
accent:                220 14% 18%
accent-foreground:     220 8% 90%
destructive:           0 70% 55%
destructive-foreground:220 8% 95%
border:                220 14% 18%
input:                 220 14% 14%
ring:                  175 80% 50%
success:               142 65% 48%
warning:               38 92% 55%
info:                  210 80% 60%
```

**Modo claro (priorizado pro portal do cliente)**
```
background:            220 14% 98%
foreground:            220 14% 10%
card:                  0 0% 100%
card-foreground:       220 14% 10%
popover:               0 0% 100%
popover-foreground:    220 14% 10%
primary:               175 70% 35%
primary-foreground:    220 14% 98%
secondary:             220 14% 94%
secondary-foreground:  220 14% 15%
muted:                 220 14% 95%
muted-foreground:      220 8% 45%
accent:                220 14% 92%
accent-foreground:     220 14% 15%
destructive:           0 70% 45%
destructive-foreground:220 14% 98%
border:                220 14% 88%
input:                 220 14% 92%
ring:                  175 70% 35%
success:               142 65% 38%
warning:               38 92% 48%
info:                  210 80% 45%
```

### Tipografia
- **Principal (UI, body, labels):** Geist — https://fonts.google.com/specimen/Geist — pesos 400, 500, 600. Sans neogrotesque técnica, super legível em corpo pequeno e escuro.
- **Mono (protagonista — números, horas, datas, IDs, status no header):** Geist Mono — https://fonts.google.com/specimen/Geist+Mono — pesos 400, 500.
- **Sem família serif.** A tipografia inteira convive entre Geist sans e Geist mono, o que dá unidade técnica.
- **Escala:**
  - text-xs 12px · text-sm 13px · text-base 14px · text-lg 16px
  - text-xl 18px · text-2xl 22px · text-3xl 28px · text-4xl 34px · text-5xl 44px
  - (a base é 14px, não 16px — densidade técnica)
- **Letter-spacing:** 0 em sans, 0 em mono. Sem nada artístico.
- **Line-height:** apertado — 1.45 para corpo, 1.15 para títulos.

### Densidade
**Compact.** Em linguagem prática: tabelas mostram **30 a 36 linhas por tela**, o dobro do Bureau. É excelente quando você quiser bater o olho e ver tudo de uma vez (ex: cronograma global com 80 atividades). O custo é o oposto: sessões muito longas cansam mais, porque a vista trabalha em informação miúda. Não é hostil — Linear faz isso há anos com sucesso — mas é uma escolha.

### Tratamento dos elementos-chave
- **Card:** fundo `card`, **sem borda** (separação por contraste de fundo), raio 6px, **sem sombra**. Padding 16px. Hover muda a borda para `border` 1px (aparece só ao passar o mouse).
- **Tabela:** **sem zebra**, linhas com borda inferior 1px `border` em opacidade 50%. Header em Geist Mono 11px, uppercase, letter-spacing 0.06em, cor `muted-foreground`. Linha 36px de altura. Números das colunas em Geist Mono, alinhados à direita. Hover: fundo `secondary`.
- **Badges de status:**
  - Rascunho: fundo `muted`, texto `muted-foreground`, em Geist Mono 10px uppercase
  - Em andamento: borda 1px `info`, texto `info`, sem fundo
  - Atrasado: borda 1px `warning`, texto `warning`, sem fundo (chama atenção sem berrar)
  - Concluído / Aprovado: borda 1px `success`, texto `success`
  - Reprovado: borda 1px `destructive`, texto `destructive`
  - Todos: pílula raio 3px, padding 2×8px. Visual de "tag de terminal".
- **Botões:**
  - Primário: fundo `primary` (ciano), texto `primary-foreground` (preto). Brilha discretamente.
  - Secundário: fundo `secondary`, texto `secondary-foreground`
  - Destrutivo: fundo `destructive`
  - Ghost: transparente
  - Todos com raio 6px, altura 32px (default) / 28px (sm) / 38px (lg). Atalho de teclado visível à direita quando aplicável (ex: `↵`, `⌘K`).
- **Barra do Gantt:** altura 22px, raio 3px. Cor sólida da fase, opacidade variando por status (concluído 100%, em andamento 80%, não iniciada 40%). Label em Geist Mono 11px ao lado da barra, fora dela (mais legível em compact).
- **Avatar do cliente:** quadrado raio 4px, 28px, iniciais em Geist Mono 11px sobre fundo `secondary` com uma faixa lateral em hue gerada por cliente.
- **Sidebar:** 200px, fundo `background` (mesmo do conteúdo, só separado por borda 1px à direita). Itens em Geist 13px com ícone Lucide 16px. Item ativo: fundo `secondary`, texto `foreground`, borda esquerda 2px `primary`. Atalho de teclado visível à direita (G+P, G+C etc.).

### Layout base
Sidebar à esquerda compacta (200px). Topbar 44px com breadcrumb + comandbar (`⌘K`) no centro + ações. **Sem largura máxima** — o conteúdo usa toda a tela (tabelas e Gantt agradecem em telas grandes). Portal do cliente: **layout completamente diferente** — modo claro, sem sidebar, hero com nome do projeto em Geist 32px, conteúdo centralizado em 720px. É o "modo apresentação" do mesmo sistema.

### Modo claro vs escuro
- **Admin:** modo escuro como padrão. Modo claro existe mas é alternativo (raro em apps técnicos de uso diário — Linear, Raycast, Vercel todos começam escuros).
- **Portal do cliente:** modo claro forçado. O cliente não tem que entrar num app preto — soaria intimidador. Claro reforça acessibilidade e neutralidade.

### Pontos fortes para o Hub
- **Densidade real.** O Gantt global com 80 atividades cabe na tela sem rolagem horizontal. Dashboards mostram muito sem agredir.
- Estética imediata de "ferramenta profissional". O efeito-wow no primeiro segundo é o mais forte das três direções.
- Atalhos de teclado e comandbar reduzem cliques no uso diário — você ganha velocidade depois de 1 semana de uso.
- Combina com o lado tech do Estúdio 33 — se o pitch envolve "operamos solo com IA", o visual reforça isso.

### Trade-offs
- **Escuro intensivo cansa olhos de alguns perfis** mais que claro, especialmente com luz ambiente forte de manhã. Pessoas com astigmatismo às vezes sofrem com texto pequeno em fundo escuro.
- O contraste estético entre admin (escuro/denso/técnico) e portal do cliente (claro/respirado) é grande. Vira quase dois apps. Pode ser força (claro: "lá fora é apresentação, aqui dentro é oficina") ou fragilidade (manutenção dobrada de tokens).
- Direção mais "trendy". Daqui a 3-4 anos pode parecer datada do jeito que apps escuro+mono+ciano de 2024-2026 parecerem. O Bureau envelhece melhor.

---

## 3. Atelier — Expressivo Tátil

### Conceito
Um estúdio criativo aterrado, com matéria. Paleta dessaturada multi-tom (verde-musgo, ferrugem, areia, tinta), serif decorativa nos títulos misturada com sans clara no corpo, mono editorial nos dados. Não é colorido pop nem é minimal técnico — é um meio-termo com personalidade própria, sem cair em "criativo genérico". Conversa com o lado autoral do Estúdio 33 — o que tem repertório visual, gosto e quer que isso apareça também na ferramenta interna.

### Referências
- **Are.na** — https://www.are.na — paleta dessaturada, tipografia respirada, tom de plataforma autoral
- **Cosmos** — https://www.cosmos.so — visual editorial moderno, sem cair no genérico de SaaS
- **Readymag (site institucional)** — https://readymag.com — tipografia expressiva sem virar bagunça, mistura serif e sans com confiança

### Paleta de cores (HSL, formato shadcn)

**Modo claro (papel cru, padrão pro admin e portal)**
```
background:            36 18% 94%   /* areia clara */
foreground:            24 18% 14%
card:                  36 22% 97%
card-foreground:       24 18% 14%
popover:               36 22% 97%
popover-foreground:    24 18% 14%
primary:               145 22% 28%   /* verde-musgo profundo */
primary-foreground:    36 18% 96%
secondary:             18 35% 60%    /* ferrugem suave (usada em destaques calmos) */
secondary-foreground:  24 18% 12%
muted:                 36 14% 88%
muted-foreground:      24 10% 38%
accent:                18 55% 52%    /* ferrugem viva — usado parcimoniosamente */
accent-foreground:     36 18% 96%
destructive:           6 65% 42%
destructive-foreground:36 18% 96%
border:                30 14% 78%
input:                 30 14% 84%
ring:                  145 22% 35%
success:               145 35% 32%
warning:               32 65% 48%
info:                  210 30% 38%
```

**Modo escuro (carvão noturno, opcional)**
```
background:            30 10% 10%
foreground:            36 18% 90%
card:                  30 10% 13%
card-foreground:       36 18% 90%
popover:               30 10% 13%
popover-foreground:    36 18% 90%
primary:               145 35% 55%
primary-foreground:    30 10% 8%
secondary:             30 10% 20%
secondary-foreground:  36 18% 88%
muted:                 30 10% 18%
muted-foreground:      36 12% 58%
accent:                18 60% 60%
accent-foreground:     30 10% 8%
destructive:           6 60% 55%
destructive-foreground:36 18% 95%
border:                30 10% 22%
input:                 30 10% 18%
ring:                  145 35% 55%
success:               145 35% 55%
warning:               32 75% 58%
info:                  210 35% 60%
```

### Tipografia
- **Display (títulos de página, hero, nome de projeto):** Instrument Serif — https://fonts.google.com/specimen/Instrument+Serif — peso 400 + itálico. Serif moderna com personalidade, lembra revista de design.
- **Corpo (UI, parágrafos, labels):** Inter — https://fonts.google.com/specimen/Inter — pesos 400, 500, 600.
- **Mono (números, horas, datas, IDs):** IBM Plex Mono — https://fonts.google.com/specimen/IBM+Plex+Mono — peso 400, 500. Mais quente que JetBrains, conversa melhor com a paleta terrosa.
- **Escala:**
  - text-xs 12px · text-sm 14px · text-base 15px · text-lg 17px
  - text-xl 20px · text-2xl 26px · text-3xl 34px · text-4xl 44px · text-5xl 60px
  - (text-5xl maior porque o display Instrument Serif pede escala)
- **Letter-spacing:** Instrument Serif sem ajuste (já vem com personalidade). Inter neutro. Mono neutro.
- **Line-height:** 1.55 para corpo, 1.1 para títulos Instrument Serif (apertado para ganhar peso de revista).

### Densidade
**Misto.** Em linguagem prática: as áreas mais "editoriais" (tela inicial do projeto, briefing, portal do cliente) respiram como o Bureau — 18-22 linhas por tela, padding generoso. Já as áreas de **produção** (tabela de atividades, Gantt, lista de tarefas) ficam densas como o Hangar — 28-32 linhas por tela. A regra: se o usuário está lendo, é confortável; se está operando, é compacto.

### Tratamento dos elementos-chave
- **Card:** fundo `card`, borda 1px `border`, raio 10px, sombra pequena (`0 1px 3px` 6% opacidade). Padding 20px. Sensação de objeto sobre papel.
- **Tabela:** linhas com borda inferior 1px `border` em opacidade 60%. Header em Inter 500 11px uppercase letter-spacing 0.08em, cor `muted-foreground`. Linha 40px (modo "produção") ou 56px (modo "editorial" — lista de projetos no dashboard). Números em IBM Plex Mono alinhados à direita.
- **Badges de status:**
  - Rascunho: fundo `muted`, texto `muted-foreground`
  - Em andamento: fundo verde-musgo claro `primary` 18% opacidade, texto `primary`
  - Atrasado: fundo ferrugem `accent` 20%, texto `accent` escuro
  - Concluído / Aprovado: fundo verde sólido `success` 18%, texto `success` escuro
  - Reprovado: fundo `destructive` 18%, texto `destructive`
  - Todos: pílula raio 6px, 11px peso 500, padding 4×10px. Sensação de etiqueta de catálogo.
- **Botões:**
  - Primário: fundo `primary` (verde-musgo), texto `primary-foreground`. Sem sombra. Texto em Inter 500.
  - Secundário: fundo `secondary` (ferrugem suave), texto `secondary-foreground`. Visualmente quente.
  - Destrutivo: `destructive`
  - Ghost: transparente, hover `muted`
  - Raio 8px, altura 38px (default) / 32px (sm) / 46px (lg).
- **Barra do Gantt:** altura 26px, raio 6px (mais arredondada que Hangar). Cor sólida com gradiente sutil (mesma matiz, 5% mais escuro à direita) para dar volume. Label da atividade dentro da barra em Inter 12px peso 500.
- **Avatar do cliente:** círculo 36px, foto se houver, senão iniciais em Instrument Serif itálico 16px sobre fundo gerado por hash do nome dentro da paleta da direção (verdes, ferrugens, areias — nunca pop).
- **Sidebar:** 260px, fundo `card` (1 nível acima do background, sutilmente destacada). Itens em Inter 14px, ícones Lucide 18px. Categoria em Instrument Serif 12px uppercase (ex: "Operação", "Cliente", "Estúdio"). Item ativo: fundo `secondary` 30% opacidade + texto `primary`.

### Layout base
Sidebar à esquerda (260px), com categorias visuais que separam blocos. Topbar 60px com nome do projeto em Instrument Serif 22px à esquerda + ações à direita. Largura máxima 1280px com margens médias. Portal do cliente: **mesmo sistema, mas amplificado** — hero do projeto com Instrument Serif 60px, kicker em mono editorial, sensação de "página de revista do projeto". Visualmente é a direção que mais aproveita o portal como peça de marca.

### Modo claro vs escuro
- **Admin:** modo claro (papel cru) como padrão. Modo escuro existe e é bonito (carvão noturno), mas é alternativo.
- **Portal do cliente:** modo claro sempre. A paleta dessaturada lê melhor no claro, e o cliente associa "papel" a profissionalismo gráfico.

### Pontos fortes para o Hub
- **Personalidade autoral imediata.** Cliente abre o portal e percebe que "tem um estúdio com gosto por trás disso", não um app genérico de gestão.
- A densidade mista respeita o que o Hub faz: leitura calma onde precisa pensar, denso onde precisa operar.
- Paleta terrosa cansa menos que cores vibrantes em sessões longas, mas tem mais sabor que cinzas puros.
- É a direção mais difícil de confundir com outro produto — diferencia o Hub de qualquer Linear-clone ou Notion-clone do mercado.

### Trade-offs
- **É a direção que mais depende de execução.** Misturar Instrument Serif com Inter exige equilíbrio fino — se algo sair errado, fica "estúdio criativo amador" em vez de "estúdio criativo confiável". Bureau e Hangar erram menos quando mal-executados.
- A paleta verde-musgo + ferrugem é uma escolha de personalidade forte. Se em 6 meses você cansar, mudar é caro (afeta todos os tokens semânticos do Gantt e dos badges).
- Densidade mista significa que partes do app vão **se parecer com dois apps diferentes** — pode confundir nas primeiras semanas até a regra "leitura vs operação" virar intuição.

---

## Como escolher

Quatro perguntas pra responder na sua cabeça antes de decidir (responda rápido, sem racionalizar demais — a primeira reação geralmente acerta):

1. **Você se vê passando 4-6 horas por dia dentro do app. Modo escuro intenso cansa ou energiza seus olhos hoje?** Se cansa → Bureau ou Atelier. Se energiza → Hangar.

2. **O portal do cliente é uma peça de venda do Estúdio 33. Você quer que ele transmita "tem um estúdio com gosto cuidando de você" (mais expressivo) ou "tem uma operação séria por trás disso" (mais sóbrio/técnico)?** Expressivo → Atelier. Sóbrio editorial → Bureau. Técnico-neutro → Hangar.

3. **Pensa na sua tela mais densa: o cronograma global com 80 atividades. Você prefere ver tudo de uma vez (compact) ou ler com calma e rolar (comfortable)?** Tudo de uma vez → Hangar. Calma → Bureau. Misto → Atelier.

4. **Daqui a 3 anos, qual visual você ainda quer estar olhando?** Bureau provavelmente envelhece melhor. Hangar é o de maior impacto agora mas envelhece pior. Atelier depende de não-saturação no uso — se você cansar do verde-musgo, cansou.

---

> Quando decidir, me avise. Eu transformo a direção escolhida nos tokens definitivos do Tailwind/shadcn e atualizo este arquivo só com a opção vencedora antes de começar o setup técnico.
