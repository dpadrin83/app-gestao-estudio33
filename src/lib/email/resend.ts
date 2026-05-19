import "server-only";
import { Resend } from "resend";

export function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || "Hub Estúdio 33 <onboarding@resend.dev>"
  );
}

export function getAdminNotifyEmail(): string | null {
  return process.env.HUB_ADMIN_EMAIL?.trim() || null;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isResendConfigured()) {
    return { ok: false, error: "E-mail não configurado (RESEND_API_KEY / RESEND_FROM_EMAIL)." };
  }

  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Resend indisponível." };
  }

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[sendEmail]", error);
    return { ok: false, error: error.message || "Falha ao enviar e-mail." };
  }

  return { ok: true };
}
