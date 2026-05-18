"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

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
