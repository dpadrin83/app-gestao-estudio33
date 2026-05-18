"use client";

import { useState, useTransition } from "react";
import {
  Card,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import {
  formatDateTime,
  formatDuration,
  durationBetween,
} from "@/lib/format";
import { toast } from "sonner";
import { deleteSession, updateSession } from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import type { TimeSession } from "@/types/database";

/** Converte ISO para "YYYY-MM-DDTHH:mm" no fuso local (pra input datetime-local) */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionsList({
  sessions,
  projectId,
}: {
  sessions: TimeSession[];
  projectId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TimeSession | null>(null);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [description, setDescription] = useState("");

  function openEdit(s: TimeSession) {
    setEditing(s);
    setStartedAt(toLocalInput(s.started_at));
    setEndedAt(s.ended_at ? toLocalInput(s.ended_at) : "");
    setDescription(s.description ?? "");
  }

  function handleSave() {
    if (!editing) return;
    const startedDate = new Date(startedAt);
    const endedDate = endedAt ? new Date(endedAt) : null;
    startTransition(async () => {
      const result = await updateSession(
        editing.id,
        {
          started_at: startedDate.toISOString(),
          ended_at: endedDate ? endedDate.toISOString() : "",
          description,
        },
        projectId,
      );
      if (result.ok) {
        toast.success("Sessão atualizada.");
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta sessão? Não pode ser desfeito.")) return;
    startTransition(async () => {
      const result = await deleteSession(id, projectId);
      if (result.ok) {
        toast.success("Sessão excluída.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (sessions.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Sem sessões ainda
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use o botão de play na lista de projetos ou no topo desta página para
          iniciar a primeira sessão.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">
                  {formatDateTime(s.started_at)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {s.ended_at ? (
                    formatDateTime(s.ended_at)
                  ) : (
                    <span className="font-semibold text-success">em curso</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">
                  {formatDuration(durationBetween(s.started_at, s.ended_at))}
                  {!s.ended_at && (
                    <span className="ml-1 text-muted-foreground">…</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.description ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(s)}
                      aria-label="Editar sessão"
                      disabled={pending}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(s.id)}
                      aria-label="Excluir sessão"
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sessão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Início</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">Fim (deixe vazio se ainda rodando)</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Descrição</Label>
              <textarea
                id="edit-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
