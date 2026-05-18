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
  const isActive = status === "active";

  function toggle() {
    startTransition(async () => {
      const target: ClientStatus = isActive ? "inactive" : "active";
      const result = await setClientStatus(id, target);
      if (result.ok) {
        toast.success(isActive ? "Cliente inativado." : "Cliente reativado.");
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
      aria-label={isActive ? "Inativar cliente" : "Reativar cliente"}
    >
      {isActive ? <Archive className="size-3.5" /> : <ArchiveRestore className="size-3.5" />}
    </Button>
  );
}
