# Deploy — Hub Estúdio 33

Checklist para publicar em produção (Vercel + Supabase).

## 0. Checagem local (antes de subir)

```bash
npm run predeploy      # check:deploy + db:bundle + build (recomendado)
# ou separado:
npm run check:deploy
npm run db:bundle      # gera supabase/apply-all.sql (15 migrations, sem seed demo)
npm run build
```

Guia passo a passo: **[PRE-DEPLOY.md](./PRE-DEPLOY.md)**.

No app: **Configurações → Publicação** mostra o mesmo status das variáveis.

## 1. Supabase (produção)

1. Crie o projeto em [supabase.com](https://supabase.com) (região `sa-east-1` se possível).
2. **SQL Editor** → execute **todas** as migrations:
   - **Opção A:** cole o arquivo gerado `supabase/apply-all.sql` (`npm run db:bundle`) — só em banco **novo**.
   - **Opção B:** rode cada arquivo em `supabase/migrations/` na ordem (até `20260521100000_gantt_recalc_respect_edits.sql`).
   - **Opção C:** `supabase link` + `supabase db push` (CLI).
3. **Authentication → Users** → crie o usuário admin (Danilo), com **Auto Confirm**.
4. **Authentication → URL Configuration**:
   - **Site URL:** `https://seu-dominio.vercel.app` (ou domínio customizado).
   - **Redirect URLs:** inclua:
     - `https://seu-dominio.vercel.app/auth/callback`
     - `http://127.0.0.1:3333/auth/callback` (dev local)

## 2. Variáveis de ambiente (Vercel)

Em **Project → Settings → Environment Variables**, configure:

| Variável | Obrigatório | Uso |
|----------|-------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Auth + DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Cliente browser/SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Convite portal, reset senha custom |
| `NEXT_PUBLIC_APP_URL` | Sim (prod) | Links em e-mails (`https://hub…`) |
| `RESEND_API_KEY` | Para e-mails | Convite, entregável, reset |
| `RESEND_FROM_EMAIL` | Para e-mails | Ex.: `Hub E33 <noreply@seudominio.com>` |
| `HUB_ADMIN_EMAIL` | Recomendado | Aviso quando cliente aprova/reprova |
| `ANTHROPIC_API_KEY` | Opcional | IA |
| `BRIEFING_STUDIO_SECRET` | Opcional | Webhook |

Copie de `.env.local.example`.

## 3. Resend

1. Conta em [resend.com](https://resend.com).
2. Verifique o domínio de envio (ou use domínio de teste no início).
3. `RESEND_FROM_EMAIL` deve usar um remetente autorizado.

## 4. Deploy na Vercel

1. Importe o repositório GitHub.
2. Framework: **Next.js** (detecção automática).
3. Cole as variáveis acima.
4. Deploy → anote a URL `.vercel.app`.
5. Atualize **Site URL** e **Redirect URLs** no Supabase com a URL final.

## 5. Testes pós-deploy

### Admin
- [ ] Login em `/login` → `/dashboard`
- [ ] Criar/editar cliente
- [ ] Criar projeto + entregável → **Enviar ao cliente**
- [ ] `/services` — domínios/hospedagem
- [ ] Dashboard mostra renovações (se houver vencimentos em 45 dias)

### Portal do cliente
- [ ] Na ficha do cliente → **Convidar ao portal** (e-mail com link)
- [ ] Cliente define senha e entra em `/portal`
- [ ] Cliente vê entregável e aprova/reprova
- [ ] Admin recebe e-mail em `HUB_ADMIN_EMAIL` (se Resend ok)

### Segurança
- [ ] Login cliente **não** acessa `/dashboard`, `/clients`, `/finance`
- [ ] Dois clientes não veem dados um do outro
- [ ] Webhook Briefing Studio retorna 401 sem Bearer correto

### Recuperação de senha
- [ ] `/login/esqueci-senha` envia link
- [ ] Link abre `/login/redefinir-senha` e salva nova senha

## 6. Seed demo (opcional)

Execute `20260519120000_demo_panorama_seed.sql` só em ambiente de teste, não em produção com dados reais.

## 7. Domínio customizado

Vercel → **Domains** → adicione `hub.estudio33.com.br` (exemplo).  
Atualize `NEXT_PUBLIC_APP_URL` e URLs do Supabase Auth.
