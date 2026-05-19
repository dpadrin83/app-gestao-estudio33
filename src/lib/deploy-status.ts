import "server-only";

export type DeployCheck = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
};

export function getDeployStatus(): DeployCheck[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const resend = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const adminEmail = process.env.HUB_ADMIN_EMAIL?.trim();

  return [
    {
      id: "supabase",
      label: "Supabase (URL + anon)",
      ok: Boolean(url && anon),
      hint: "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
    {
      id: "service_role",
      label: "Service role (convite portal)",
      ok: Boolean(service),
      hint: "SUPABASE_SERVICE_ROLE_KEY — Settings → API no Supabase",
    },
    {
      id: "app_url",
      label: "URL do app (links em e-mails)",
      ok: Boolean(appUrl),
      hint: "NEXT_PUBLIC_APP_URL — em prod use https://seu-dominio.vercel.app",
    },
    {
      id: "resend",
      label: "Resend (e-mails transacionais)",
      ok: Boolean(resend && from),
      hint: "RESEND_API_KEY + RESEND_FROM_EMAIL",
    },
    {
      id: "admin_email",
      label: "E-mail admin (avisos do portal)",
      ok: Boolean(adminEmail),
      hint: "HUB_ADMIN_EMAIL — quando cliente aprova entregável",
    },
  ];
}
