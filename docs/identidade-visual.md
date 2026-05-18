# Identidade Visual — Hub Estúdio 33

> **Status:** aprovado inicialmente em 2026-05-18.
> **Direção escolhida:** *Hub · E33 Dark* — fusão da personalidade técnica/densa (Hangar) com a identidade visual oficial do Estúdio 33 (paleta brand, gradiente, Geist) sobre base escura.
> **Referência viva:** [docs/mockups/hub.html](mockups/hub.html) — abra para ver paleta, tipografia e tratamento de cada elemento na prática.

---

## Personalidade visual

Operação técnica de estúdio criativo aterrado. Densidade alta, dados em mono protagonista, atalhos por toda parte. **Fundo dark com gradiente brand ambiente sutil** (mesh de cores brand atrás) e cards alternando entre **sólidos coloridos vibrantes** (KPIs e blocos de destaque) e **glass dark** (informações secundárias). Linhas pill arredondadas para listagens (estilo Aura Learning). Brand-stripe colorida fina no topo de toda tela — assinatura da marca.

Inspirações: **Aurora Garden Control** (cards mistos coloridos + glass), **Aura Learning Dashboard** (linhas pill por cor), **Linear** (densidade e atalhos), **E33_OS DS v2 Brand** (paleta e gradiente oficiais).

---

## Tokens (prontos para Tailwind / shadcn)

### Base dark

```
--bg:        #0A0B10
--bg-2:      #0E1018
--surface:   rgba(255,255,255,0.04)
--surface-2: rgba(255,255,255,0.06)
--surface-3: #14161D
--border:    rgba(255,255,255,0.08)
--border-2:  rgba(255,255,255,0.16)
--text:      #F0F0F2
--text-2:    #C8CAD0
--muted:     #8B8E96
--disabled:  #5A5D65
```

### Brand (oficial do logo Estúdio 33)

```
--b-yellow:  #FFBD00
--b-orange:  #FF5400
--b-pink:    #FF0054
--b-magenta: #C52AAF
--b-purple:  #5C28DB
--b-blue:    #2D79E6
--b-black:   #262828
```

### Gradiente icônico (assinatura da marca)

```
--grad:       linear-gradient(90deg,#FFBD00 0%,#FF5400 20%,#FF0054 40%,#C52AAF 60%,#5C28DB 80%,#2D79E6 100%)
--grad-diag:  linear-gradient(135deg,#FFBD00 0%,#FF5400 13%,#FF0054 29%,#C52AAF 48%,#5C28DB 67%,#2D79E6 87%)
--grad-text:  linear-gradient(90deg,#FFBD00,#FF5400,#FF0054,#C52AAF,#5C28DB,#2D79E6)
```

**Quando usar o gradiente** — brand-stripe do topo, nome do Danilo no greeting, marcos de entrega no Gantt, ícones de apps especialistas, barra de progresso de projetos em briefing. **Não usar** como fundo de tela inteiro, em corpo de texto ou em todo botão. Máximo 2× por tela.

### Semânticos

```
--success: #22C55E
--warning: #F59E0B
--danger:  #EF4444
```

### Ambient mesh (fundo da página)

```
body::before {
  background:
    radial-gradient(ellipse 600px 400px at 10% 0%,  rgba(92,40,219,0.18), transparent 60%),
    radial-gradient(ellipse 700px 500px at 90% 20%, rgba(255,0,84,0.10), transparent 60%),
    radial-gradient(ellipse 600px 400px at 50% 100%,rgba(45,121,230,0.12), transparent 60%),
    radial-gradient(ellipse 500px 300px at 100% 80%,rgba(255,189,0,0.06), transparent 60%);
}
```

---

## Tipografia

- **Principal (UI, body, labels):** Geist — pesos 400, 500, 600, 700. https://fonts.google.com/specimen/Geist
- **Mono (números, datas, IDs, atalhos, kicker, badges):** Geist Mono — pesos 400, 500, 600. https://fonts.google.com/specimen/Geist+Mono
- **Display ocasional (Instrument Serif):** para hero/título de seções editoriais quando precisar de quebra de tom — opcional, usar com economia. https://fonts.google.com/specimen/Instrument+Serif

### Escala

```
text-xs   10px   labels uppercase, eyebrow, badge mono
text-sm   11px   metadados, datas secundárias
text-base 13px   body padrão de interface
text-md   15px   labels destacados, nomes em listas
text-lg   17–18px  títulos de card / seção menor
text-xl   22–24px  títulos de seção
text-2xl  30–32px  título de página
text-3xl  38–42px  hero greeting
```

Letter-spacing nos títulos: `-0.02em` a `-0.03em`. Body neutro.
Line-height: 1.5 para corpo, 1.05–1.2 para títulos, 1.4 para mono.

---

## Acentos por módulo

Cada módulo do Hub tem uma cor brand fixa. Aparece como **dot quadrado** na sidebar (com glow sutil quando ativo), **borda esquerda** em cards e **cor da barra** no Gantt.

```
Cockpit (Dashboard) → #E8E8E8 (cinza claro, dot só)
Atendimento         → #2D79E6 blue
Projetos / Pipeline → #5C28DB purple
Cronograma          → #C52AAF magenta
Entregáveis         → #FF0054 pink
Clientes / Criação  → #FF5400 orange
Financeiro / Adm    → #FFBD00 yellow
Acervo              → #6B6B6B grafite
Prompts             → #5C28DB purple (compartilha com Pipeline)
```

---

## Status oficiais (16 etapas — E33_OS)

`ideia · lead · briefing · diagnóstico · proposta · aguardando_aprovacao · aprovado · planejamento · em_producao · revisao_interna · aguardando_cliente · em_ajuste · entregue · faturado · recorrente · arquivado`

Badge dark: `font-family: mono; font-size: 10px; padding: 4px 10px; border-radius: pill; background: rgba(cor,0.18); color: tint claro; border: 1px solid rgba(cor,0.4)`. Sempre lowercase.

---

## Densidade

**Compact, com respiro nos cards de destaque.**

- Sidebar **220px** com itens 13px, padding 8px.
- Topbar **56px** com comandbar `⌘K` central.
- Tabela/lista de projetos: linhas **pill arredondadas** de 76px de altura com gradient pastel da cor do projeto.
- Cards de KPI: padding 16–20px, valores em mono 22–28px.
- Cards "hero" (foco do dia, faturamento, capacidade): padding 22px, radius `24px`.

---

## Tratamento de elementos-chave

### Brand-stripe

Faixa de 3px com gradient horizontal, **sticky no topo de toda tela**. Assinatura da marca.

### Greeting

`"Boa tarde, Danilo."` — *Danilo* recebe o gradient-text. Fonte Geist 42px peso 700, letter-spacing -0.03em.

### Cards

**Glass** (default para info secundária):
```
background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
backdrop-filter: blur(20px);
border-radius: 24px;
border: 1px gradient via mask trick (rgba(255,255,255,0.18) → 0.02)
```

**Sólidos brand** (para destaques fortes — foco do dia, faturamento, capacidade):
```
background: linear-gradient(140deg, [brand-color] 0%, [brand-darker] 100%);
border: 1px solid rgba(255,255,255,0.14);
box-shadow: 0 8px 32px rgba(0,0,0,0.3);
border-radius: 24px;
```

### Linhas de projeto (Aura-style)

Cada projeto recebe a cor brand do seu módulo:
```
background: linear-gradient(90deg, rgba(brand, 0.18), rgba(brand, 0.06));
border: 1px solid rgba(brand, 0.3);
border-radius: 20px;
padding: 16px 22px;
```
Avatar circular 44px com status dot (verde/amarelo/vermelho) no canto.

### Barras do Gantt

Pill arredondada com glow na cor do módulo:
```
background: var(--b-[cor]);
box-shadow: 0 0 12px rgba([brand], 0.4);
border-radius: 999px;
height: 24px;
```
Marcos de entrega final usam `--grad` (gradient brand inteiro).

### Botões

- **Primário:** `background: var(--grad)` ou `background: white; color: #1a1a1a` (em cards coloridos).
- **Secundário:** `background: var(--surface); border: 1px solid var(--border); color: var(--text)`.
- **Ghost:** transparente, hover `var(--surface-2)`.
- **Pill-button** (estilo Aura/Aurora): `border-radius: pill; padding: 9px 14px`.

### Sidebar

Itens 8px de padding, dot quadrado da cor do módulo à esquerda. **Item ativo**: barra gradient à esquerda de 3px, fundo `surface-2`. Atalho de teclado (`G D`, `G G`, `G F`) à direita quando aplicável.

### Comandbar

`⌘K` no centro do topo. Border surface, hover sutil. Funciona em todas as telas.

---

## Logo

Dois arquivos SVG oficiais do Estúdio 33 — usar inline:
- `logo-dark.svg` — sobre fundo claro (wordmark em cinza)
- `logo-light.svg` — sobre fundo escuro (wordmark em branco) ← **default no Hub**

O "33" sempre vem com gradient diagonal brand. Não recolorir, não distorcer. Tamanho mínimo legível: altura 20px.

---

## Histórico — direções avaliadas

Antes da escolha, foram apresentadas 3 direções genéricas como vocabulário de personalidade:

1. **Bureau** — editorial sóbrio, claro, Fraunces + Inter, terracota. ([docs/mockups/bureau.html](mockups/bureau.html))
2. **Hangar** — técnico denso, escuro, Geist + Mono, ciano. ([docs/mockups/hangar.html](mockups/hangar.html))
3. **Atelier** — expressivo tátil, papel cru, Instrument Serif, verde-musgo + ferrugem. ([docs/mockups/atelier.html](mockups/atelier.html))

A direção final fundiu a **personalidade da Hangar** com a **identidade visual oficial E33** sobre base **dark**, usando a estética de cards mistos (sólidos + glass) das referências Aurora Garden + Aura Learning. Os 3 mockups originais ficam preservados como referência de processo.

---

## Próximo passo

Esses tokens viram variáveis CSS no setup do Tailwind/shadcn quando começar a Fase 1. O mockup [hub.html](mockups/hub.html) serve de fonte de verdade visual — qualquer divergência futura na implementação reabre essa decisão aqui.
