# Pré-deploy — checklist único

Use esta lista **na ordem** para publicar o Hub de uma vez (Supabase + Vercel).

## A. No seu Mac (agora)

```bash
npm run predeploy          # env + apply-all.sql + build
npm run db:verify          # opcional: confirma tabelas no Supabase (precisa .env)
```

- [ ] `npm run predeploy` terminou sem erro
- [ ] Código commitado e push no GitHub (repositório que a Vercel vai importar)
- [ ] Decidir URL final: `https://_____.vercel.app` ou domínio customizado

### Variáveis — copiar para a Vercel

| Variável | Local | Produção |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | mesmo projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | mesmo |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | mesmo |
| `NEXT_PUBLIC_APP_URL` | `http://127.0.0.1:3333` | **URL final HTTPS** |
| `RESEND_API_KEY` | ○ | **obrigatório** para convites/e-mails |
| `RESEND_FROM_EMAIL` | ✓ | remetente verificado no Resend |
| `HUB_ADMIN_EMAIL` | ○ | seu e-mail (avisos de aprovação) |
| `ANTHROPIC_API_KEY` | opcional | se usar IA |

---

## B. Supabase (produção)

### Banco novo (recomendado na 1ª publicação)

1. SQL Editor → cole **`supabase/apply-all.sql`** (gerado pelo `predeploy`) → **Run**
2. Confirme com **`supabase/verify-migrations.sql`** → deve mostrar tudo OK

### Banco que você já usa (dev)

Você já aplicou as migrations manualmente. Só confira se esta está aplicada:

- `20260521100000_gantt_recalc_respect_edits.sql` ← cronograma editável

### Auth

1. **Users** → usuário admin (Danilo), **Auto Confirm**
2. **URL Configuration** (substitua pela URL real após o deploy):

   - **Site URL:** `https://SUA-URL.vercel.app`
   - **Redirect URLs:**
     - `https://SUA-URL.vercel.app/auth/callback`
     - `http://127.0.0.1:3333/auth/callback`

---

## C. Resend (e-mails)

1. Conta + domínio verificado (ou `onboarding@resend.dev` só para testes)
2. `RESEND_FROM_EMAIL` = remetente autorizado
3. `RESEND_API_KEY` na Vercel

Sem Resend: app funciona, mas **sem** convite portal, reset de senha por e-mail e notificações.

---

## D. Vercel

1. **Add New Project** → importar repo GitHub
2. Framework: Next.js (auto)
3. **Environment Variables** → colar tabela da seção A (Production)
4. **Deploy**
5. Copiar URL `.vercel.app` → atualizar `NEXT_PUBLIC_APP_URL` na Vercel → **Redeploy**
6. Atualizar **Site URL** e **Redirect URLs** no Supabase (seção B)

`vercel.json` já define região `gru1` (São Paulo).

---

## E. Testes pós-deploy (15 min)

### Admin
- [ ] `/login` → `/dashboard` (layout hub)
- [ ] Cliente + projeto + cronograma (editar status/data na tabela)
- [ ] Entregável → **Enviar ao cliente**
- [ ] `/finance` e `/services`

### Portal
- [ ] Cliente → **Convidar ao portal**
- [ ] E-mail chega → definir senha → `/portal`
- [ ] Aprovar/reprovar entregável
- [ ] Admin recebe aviso em `HUB_ADMIN_EMAIL`

### Segurança
- [ ] Cliente **não** abre `/dashboard` nem `/clients`
- [ ] `/login/esqueci-senha` funciona (com Resend)

---

## F. O que NÃO fazer em produção

- Não rodar `20260519120000_demo_panorama_seed.sql` (só ambiente de teste)
- Não commitar `.env.local`
- Não expor `SUPABASE_SERVICE_ROLE_KEY` no browser

---

## Ordem das 15 migrations (referência)

| # | Arquivo |
|---|---------|
| 1 | `20260518000001_initial_schema.sql` |
| 2 | `20260518120000_phase2_gantt.sql` |
| 3 | `20260518180000_phase3_portal_deliverables_finance.sql` |
| 4 | `20260518200000_phase4_ai.sql` |
| 5 | `20260518210000_phase5_tasks.sql` |
| 6 | `20260518220000_client_company_contact.sql` |
| 7 | `20260518230000_phase7_links_payment.sql` |
| 8 | `20260519000000_phase8_service_line_deliverable_plan.sql` |
| 9 | `20260520100000_project_macro_plan.sql` |
| 10 | `20260520120000_prompt_templates.sql` |
| 11 | `20260520140000_client_logo_url.sql` |
| 12 | `20260520150000_client_portal_background.sql` |
| 13 | `20260520160000_client_services.sql` |
| 14 | `20260520170000_client_assets_storage.sql` |
| 15 | `20260521100000_gantt_recalc_respect_edits.sql` |
| 16 | `20260521110000_client_access.sql` |
| 17 | `20260521120000_client_access_due_password.sql` |
| 18 | `20260521130000_client_access_unify.sql` |
| 19 | `20260521140000_project_deliverable_plan.sql` |
| 20 | `20260521150000_studio_deliverable_catalog.sql` |
| 21 | `20260521160000_deliverable_catalog_groups.sql` |
| 22 | `20260521170000_seed_branding_catalog_areas.sql` (opcional — áreas vazias branding) |
| 23 | `20260521180000_seed_onboarding_catalog_steps.sql` (área Onboarding + 5 etapas) |
| 24 | `20260521190000_seed_branding_strategy_catalog_steps.sql` (branding + estratégia, 18 etapas) |

Detalhes: [deploy.md](./deploy.md)
