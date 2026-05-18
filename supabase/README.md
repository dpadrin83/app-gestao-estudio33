# Supabase — Hub Estúdio 33

Este projeto usa Supabase para auth + Postgres + RLS. As migrations SQL ficam em `supabase/migrations/`.

## Setup inicial (1× só)

### 1. Criar projeto no Supabase
1. Vá em https://supabase.com/dashboard e crie um novo projeto.
2. Escolha região mais próxima (São Paulo / `aws-sa-east-1`).
3. Anote a senha do banco — você vai precisar.

### 2. Copiar credenciais para `.env.local`
No dashboard do projeto, **Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` = "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = "anon public" key
- `SUPABASE_SERVICE_ROLE_KEY` = "service_role secret" key (não exponha em código client!)

Cole no `.env.local` da raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### 3. Aplicar as migrations

**Opção A — Dashboard (mais simples):**
1. No dashboard do Supabase → **SQL Editor** → **New query**.
2. Cole o conteúdo de `supabase/migrations/20260518000001_initial_schema.sql`.
3. Clique em **Run**.

**Opção B — Supabase CLI (recomendado se você for fazer várias):**
```bash
npm install -g supabase
supabase login
supabase link --project-ref <id-do-projeto>
supabase db push
```

### 4. Criar usuário admin (você)
**Dashboard → Authentication → Users → Add user → Create new user**

- Email: o seu (Danilo)
- Password: crie uma senha forte
- ✅ Auto Confirm User (pra não precisar de e-mail de confirmação)

Não há tela de signup público — todo usuário é criado manualmente aqui. (Na Fase 3, vamos criar usuários "cliente" pelo admin.)

## Gerar types do TypeScript (opcional)

Quando o schema crescer, você pode regerar os types em `src/types/database.ts` automaticamente:

```bash
supabase gen types typescript --project-id <id-do-projeto> > src/types/database.ts
```

Por enquanto, mantemos um types manual em `src/types/database.ts` alinhado com o schema desta migration.

## Migrations futuras

Cada nova migration entra em `supabase/migrations/` com timestamp no nome (`YYYYMMDDHHMMSS_descrição.sql`). A ordem alfabética é a ordem de aplicação.
