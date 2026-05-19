"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inviteClientToPortal, revokePortalAccess } from "@/lib/actions/portal-auth";
import { toast } from "sonner";
import { Link2, Mail, Unlink } from "lucide-react";
import type { Client } from "@/types/database";

export function PortalAccessPanel({ client }: { client: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasAccess = Boolean(client.auth_user_id);
  const hasEmail = Boolean(client.email?.trim());

  function invite() {
    startTransition(async () => {
      const result = await inviteClientToPortal(client.id);
      if (result.ok) {
        toast.success(
          `Convite enviado para ${result.data?.email ?? client.email}.`,
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function revoke() {
    if (!confirm("Remover acesso ao portal? O usuário Auth continua existindo.")) {
      return;
    }
    startTransition(async () => {
      const result = await revokePortalAccess(client.id);
      if (result.ok) {
        toast.success("Acesso ao portal removido.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="space-y-4 border-border/80 p-5">
      <div>
        <h3 className="text-sm font-semibold">Acesso ao portal</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          O cliente aprova entregáveis e acompanha fases do projeto. O convite vai
          para o e-mail do contato principal.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={
            hasAccess
              ? "rounded-full bg-success/15 px-2.5 py-0.5 font-mono text-[10px] uppercase text-success"
              : "rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
          }
        >
          {hasAccess ? "Vinculado" : "Sem login"}
        </span>
        {hasAccess && client.auth_user_id && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {client.auth_user_id.slice(0, 8)}…
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !hasEmail}
          onClick={invite}
        >
          <Mail className="size-4" />
          {hasAccess ? "Reenviar convite" : "Convidar ao portal"}
        </Button>
        {hasAccess && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={revoke}
          >
            <Unlink className="size-4" />
            Remover vínculo
          </Button>
        )}
      </div>
      {!hasEmail && (
        <p className="text-xs text-destructive">
          Cadastre o e-mail em Contato principal antes de convidar.
        </p>
      )}
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Link2 className="mt-0.5 size-3.5 shrink-0" />
        Requer <code className="text-[10px]">RESEND_API_KEY</code> e{" "}
        <code className="text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> no servidor.
      </p>
    </Card>
  );
}
