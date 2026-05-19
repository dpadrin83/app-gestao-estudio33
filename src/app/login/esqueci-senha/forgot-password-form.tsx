"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if (result.ok) {
        setSent(true);
        toast.success("Se o e-mail existir, você receberá o link em instantes.");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (sent) {
    return (
      <p className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Verifique sua caixa de entrada (e spam). O link expira em algumas horas.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        <Mail className="size-4" />
        {pending ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
