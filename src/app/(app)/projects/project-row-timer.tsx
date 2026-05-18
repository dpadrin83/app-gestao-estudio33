"use client";

import { useState, useTransition } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { startSession, stopActiveSession } from "@/lib/actions/sessions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProjectRowTimer({
  projectId,
  isActiveForThis,
}: {
  projectId: string;
  isActiveForThis: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");

  function handleStart() {
    startTransition(async () => {
      const result = await startSession(projectId);
      if (result.ok) {
        toast.success("Timer iniciado.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleStop() {
    setDescription("");
    setOpen(true);
  }

  function confirmStop() {
    startTransition(async () => {
      const result = await stopActiveSession(projectId, description);
      if (result.ok) {
        toast.success("Sessão registrada.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (isActiveForThis) {
    return (
      <>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleStop}
          disabled={pending}
          aria-label="Parar timer"
          className="h-8 w-8 p-0"
        >
          <Square className="size-3.5" />
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Encerrar sessão</DialogTitle>
              <DialogDescription>
                O que você fez nesta sessão? (opcional, mas ajuda no histórico)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <textarea
                id="desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Diagramação do manual de marca, páginas 1-4."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button onClick={confirmStop} disabled={pending}>
                {pending ? "Salvando…" : "Encerrar e salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleStart}
      disabled={pending}
      aria-label="Iniciar timer"
      className="h-8 w-8 p-0"
    >
      <Play className="size-3.5" />
    </Button>
  );
}
