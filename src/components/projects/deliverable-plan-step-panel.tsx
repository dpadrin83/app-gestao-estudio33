"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListChecks, Plus, ExternalLink, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePlanItemExecutionChecklist,
  seedPlanItemExecutionChecklist,
} from "@/lib/actions/deliverable-plan";
import {
  buildDefaultChecklist,
  getSuggestedChecklistLabels,
  newChecklistItem,
} from "@/lib/playbooks/execution-checklist";
import type {
  DeliverablePlanItem,
  ExecutionChecklistItem,
  ProjectLink,
} from "@/types/database";

function parseNotesTags(notes: string | null): { body: string; tags: string[] } {
  if (!notes?.trim()) return { body: "", tags: [] };
  const tags: string[] = [];
  let body = notes;
  for (const m of notes.matchAll(/\[(INTERNO|APROVAÇÃO CLIENTE|APROVACAO CLIENTE)\]/gi)) {
    tags.push(m[1]!.toUpperCase());
  }
  body = body.replace(/\[[^\]]+\]/g, "").trim();
  return { body, tags };
}

export function DeliverablePlanStepPanel({
  projectId,
  item,
  projectLinks,
  open,
  onOpenChange,
}: {
  projectId: string;
  item: DeliverablePlanItem | null;
  projectLinks: ProjectLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checklist, setChecklist] = useState<ExecutionChecklistItem[]>([]);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (!item) return;
    setChecklist(
      item.execution_checklist.length > 0
        ? item.execution_checklist
        : buildDefaultChecklist(item.name),
    );
    setNewLabel("");
  }, [item?.id, item?.execution_checklist, item?.name]);

  if (!item) return null;

  const { body: notesBody, tags } = parseNotesTags(item.notes);
  const hasSuggested = getSuggestedChecklistLabels(item.name).length > 0;
  const persisted = item.execution_checklist.length > 0;

  function persist(next: ExecutionChecklistItem[]) {
    setChecklist(next);
    startTransition(async () => {
      const result = await updatePlanItemExecutionChecklist(
        item!.id,
        projectId,
        next,
      );
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  function toggle(id: string) {
    persist(
      checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    );
  }

  function loadSuggested() {
    if (!item) return;
    startTransition(async () => {
      const result = await seedPlanItemExecutionChecklist(item.id, projectId);
      if (result.ok && result.data) {
        setChecklist(result.data.checklist);
        toast.success("Checklist sugerida aplicada.");
        router.refresh();
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function addCustomItem() {
    const label = newLabel.trim();
    if (!label) return;
    const next = [...checklist, newChecklistItem(label)];
    setNewLabel("");
    persist(next);
  }

  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left">{item.name}</DialogTitle>
          <DialogDescription className="text-left">
            Playbook de execução — não altera a ordem do cronograma. A etapa
            macro só avança no Gantt quando você publicar/atualizar datas lá.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {notesBody && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {notesBody}
            </div>
          )}

          {item.predecessor && (
            <p className="text-xs text-muted-foreground">
              No plano, começa após:{" "}
              <span className="font-medium text-foreground">
                {item.predecessor.name}
              </span>
            </p>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="size-4 text-brand-orange" />
                Checklist de execução
                {checklist.length > 0 && (
                  <span className="font-normal text-muted-foreground">
                    ({doneCount}/{checklist.length})
                  </span>
                )}
              </h3>
              {hasSuggested && !persisted && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={loadSuggested}
                >
                  Salvar checklist sugerida
                </Button>
              )}
            </div>

            {checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem passos sugeridos para esta etapa. Adicione itens abaixo ou
                use as notas do catálogo.
              </p>
            ) : (
              <ul className="space-y-2">
                {checklist.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/40">
                      <input
                        type="checkbox"
                        checked={c.done}
                        disabled={pending}
                        onChange={() => toggle(c.id)}
                        className="mt-1 rounded border-border"
                      />
                      <span
                        className={
                          c.done
                            ? "text-sm text-muted-foreground line-through"
                            : "text-sm"
                        }
                      >
                        {c.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Passo personalizado…"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomItem();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={pending || !newLabel.trim()}
                onClick={addCustomItem}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-dashed border-brand-orange/30 bg-brand-orange/5 p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-brand-orange" />
              Acessos deste projeto
            </h3>
            <p className="text-xs text-muted-foreground">
              Links, Supabase, Vercel e senhas ficam só aqui no Hub — o cliente
              do portal não vê esta aba.
            </p>
            {projectLinks.length === 0 ? (
              <Link
                href="#links"
                className="text-sm text-brand-orange hover:underline"
                onClick={() => onOpenChange(false)}
              >
                Cadastrar em Acessos e credenciais →
              </Link>
            ) : (
              <ul className="space-y-1.5">
                {projectLinks.slice(0, 6).map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate font-medium">{l.name}</span>
                    {l.url ? (
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-brand-orange hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        credencial
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="#links"
              className="inline-block text-xs text-brand-orange hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Abrir todos os acessos →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
