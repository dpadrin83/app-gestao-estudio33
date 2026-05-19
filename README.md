# Hub Estúdio 33

Sistema de gestão interno do Estúdio 33.

## Por onde começar

**Leia o [`CONTEXTO.md`](./CONTEXTO.md) antes de qualquer coisa.** Ele é a porta de entrada do projeto: identidade, stack, decisões já tomadas, como o Danilo trabalha e qual é o próximo passo.

Todo prompt novo no Cursor / Claude Code deve **começar lendo o `CONTEXTO.md`** para evitar mistura de contexto com outros projetos do Estúdio 33.

## Estrutura desta pasta

```
APP_GESTAO-ESTUDIO33/
├── CONTEXTO.md       → fonte única de verdade, ler primeiro
├── README.md         → este arquivo
├── briefing.md       → briefing completo do sistema (escopo, fases, regras)
├── docs/             → documentação técnica e de produto
│   ├── identidade-visual.md
│   ├── arquitetura.md
│   └── decisoes.md
├── prds/             → PRDs por fase (Fase 1, 2, 3, 4)
└── _ARQUIVO/         → versões antigas, duplicatas, material de referência
```

## Status

App funcional (Fases 1–8). Pronto para deploy — ver **[docs/deploy.md](docs/deploy.md)**.

```bash
npm install
cp .env.local.example .env.local   # preencher Supabase + Resend
npm run dev                        # http://127.0.0.1:3333
```
