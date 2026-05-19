"use client";

import Link from "next/link";
import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const params = use(searchParams);
  const from = params.from && params.from !== "/login" ? params.from : "/dashboard";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.ok) {
        toast.success("Login feito.");
        router.push(from);
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/login/esqueci-senha"
            className="text-xs text-muted-foreground hover:text-brand-orange hover:underline"
          >
            Esqueci a senha
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
        size="lg"
      >
        <LogIn className="size-4" />
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Sem opção de cadastro público — usuários são criados manualmente no Supabase.
      </p>
    </form>
  );
}
