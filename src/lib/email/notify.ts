import "server-only";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail, isResendConfigured, getAdminNotifyEmail } from "@/lib/email/resend";
import {
  portalInviteEmail,
  deliverableSentEmail,
  deliverableReviewedEmail,
  passwordResetEmail,
} from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function emailPortalInvite(opts: {
  to: string;
  clientName: string;
  actionLink: string;
}): Promise<void> {
  if (!isResendConfigured()) return;
  const result = await sendEmail({
    to: opts.to,
    subject: `Portal Estúdio 33 — acesso para ${opts.clientName}`,
    html: portalInviteEmail(opts),
  });
  if (!result.ok) console.warn("[emailPortalInvite]", result.error);
}

export async function emailDeliverableSent(opts: {
  to: string;
  clientName: string;
  projectName: string;
  deliverableName: string;
  projectId: string;
}): Promise<void> {
  if (!isResendConfigured()) return;
  const portalUrl = `${getAppUrl()}/portal/projects/${opts.projectId}`;
  const result = await sendEmail({
    to: opts.to,
    subject: `Novo entregável: ${opts.deliverableName}`,
    html: deliverableSentEmail({ ...opts, portalUrl }),
  });
  if (!result.ok) console.warn("[emailDeliverableSent]", result.error);
}

export async function emailDeliverableReviewed(opts: {
  clientName: string;
  projectName: string;
  deliverableName: string;
  decision: "approved" | "rejected";
  projectId: string;
}): Promise<void> {
  const adminEmail = getAdminNotifyEmail();
  if (!adminEmail || !isResendConfigured()) return;
  const projectUrl = `${getAppUrl()}/projects/${opts.projectId}#entregaveis`;
  const label =
    opts.decision === "approved" ? "Aprovado" : "Ajustes solicitados";
  const result = await sendEmail({
    to: adminEmail,
    subject: `${label}: ${opts.deliverableName} — ${opts.clientName}`,
    html: deliverableReviewedEmail({ ...opts, projectUrl }),
  });
  if (!result.ok) console.warn("[emailDeliverableReviewed]", result.error);
}

/** Envia link de recuperação via Resend (em vez do e-mail padrão do Supabase). */
export async function emailPasswordReset(opts: {
  to: string;
  actionLink: string;
}): Promise<void> {
  if (!isResendConfigured()) return;
  const result = await sendEmail({
    to: opts.to,
    subject: "Redefinir senha — Hub Estúdio 33",
    html: passwordResetEmail(opts),
  });
  if (!result.ok) console.warn("[emailPasswordReset]", result.error);
}

export async function generatePasswordResetLink(
  email: string,
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${getAppUrl()}/auth/callback?next=/login/redefinir-senha`,
      },
    });
    if (error) {
      return { ok: false, error: "Não encontramos uma conta com este e-mail." };
    }
    const link = data.properties?.action_link;
    if (!link) {
      return { ok: false, error: "Não foi possível gerar o link de recuperação." };
    }
    return { ok: true, link };
  } catch (e) {
    console.error("[generatePasswordResetLink]", e);
    return { ok: false, error: "Serviço de autenticação indisponível." };
  }
}
