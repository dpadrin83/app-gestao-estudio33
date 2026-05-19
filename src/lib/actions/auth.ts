"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { getHubRole } from "@/lib/auth/roles";
import {
  emailPasswordReset,
  generatePasswordResetLink,
} from "@/lib/email/notify";
import { isResendConfigured } from "@/lib/email/resend";

const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha precisa ter pelo menos 6 caracteres"),
});

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Mensagens em PT-BR para os erros mais comuns
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid")) {
      return { ok: false, error: "E-mail ou senha incorretos." };
    }
    if (msg.includes("email not confirmed")) {
      return { ok: false, error: "E-mail ainda não confirmado." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const EmailOnlySchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = EmailOnlySchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "E-mail inválido.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (isResendConfigured()) {
    const linkResult = await generatePasswordResetLink(email);
    if (!linkResult.ok) {
      // Não revelar se o e-mail existe — mensagem genérica em produção
      return { ok: true };
    }
    await emailPasswordReset({ to: email, actionLink: linkResult.link });
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/login/redefinir-senha`,
  });

  if (error) {
    console.error("[requestPasswordResetAction]", error);
  }

  return { ok: true };
}

const NewPasswordSchema = z
  .object({
    password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem.",
    path: ["confirm"],
  });

export async function updatePasswordAction(
  formData: FormData,
): Promise<
  { ok: true; redirectTo: string } | { ok: false; error: string }
> {
  const parsed = NewPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error("[updatePasswordAction]", error);
    return {
      ok: false,
      error: "Não foi possível atualizar a senha. Tente o link de recuperação novamente.",
    };
  }

  const { role } = await getHubRole();
  return {
    ok: true,
    redirectTo: role === "client" ? "/portal" : "/dashboard",
  };
}
