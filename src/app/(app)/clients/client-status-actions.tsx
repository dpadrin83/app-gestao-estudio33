"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setClientStatus } from "@/lib/actions/clients";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import type { ClientStatus } from "@/types/database";

export function ClientStatusActions({
  id,
  status,
}: {
  id: string;
  status: ClientStatus;
}) {
  const [pending, startTransition] = useTransition();
  const isArchived = status === "inactive";

  function toggle() {
    startTransition(async () => {
      const target: ClientStatus = isArchived ? "active" : "inactive";
      const result = await setClientStatus(id, target);
      if (result.ok) {
        toast.success(
          isArchived ? "Cliente reativado (status ativo)." : "Cliente arquivado.",
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-label={isArchived ? "Reativar cliente" : "Arquivar cliente"}
      title={isArchived ? "Reativar" : "Arquivar"}
    >
      {isArchived ? (
        <ArchiveRestore className="size-3.5" />
      ) : (
        <Archive className="size-3.5" />
      )}
    </Button>
  );
}
