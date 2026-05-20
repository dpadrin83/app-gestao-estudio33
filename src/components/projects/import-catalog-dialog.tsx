"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importCatalogGroupToProject,
  importCatalogToProject,
} from "@/lib/actions/deliverable-catalog";
import { deliverableTypeLabels } from "@/lib/format";
import type { DeliverableCatalogGroupWithItems } from "@/types/database";
import { cn } from "@/lib/utils";

export function ImportCatalogDialog({
  projectId,
  groups,
  hasExistingPlan,
}: {
  projectId: string;
  groups: DeliverableCatalogGroupWithItems[];
  hasExistingPlan: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [replace, setReplace] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeItems = activeGroup?.items ?? [];

  function openDialog() {
    const first = groups[0];
    setActiveGroupId(first?.id ?? "");
    setSelected(new Set(first?.items.map((i) => i.id) ?? []));
    setOpen(true);
  }

  function selectGroup(groupId: string) {
    setActiveGroupId(groupId);
    const g = groups.find((x) => x.id === groupId);
    setSelected(new Set(g?.items.map((i) => i.id) ?? []));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllInGroup() {
    setSelected(new Set(activeItems.map((i) => i.id)));
  }

  function importSelected() {
    startTransition(async () => {
      const result = await importCatalogToProject(
        projectId,
        [...selected],
        { replaceExisting: replace },
      );
      if (result.ok) {
        toast.success(`${result.data?.count ?? 0} etapa(s) importadas.`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function importWholeArea() {
    if (!activeGroupId) return;
    startTransition(async () => {
      const result = await importCatalogGroupToProject(projectId, activeGroupId, {
        replaceExisting: replace,
      });
      if (result.ok) {
        toast.success(
          `Área "${activeGroup?.name}" importada (${result.data?.count ?? 0} etapas).`,
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={totalItems === 0}
        onClick={openDialog}
      >
        <Download className="size-4" />
        Importar do catálogo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar do catálogo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Escolha uma área (ex.: Onboarding) ou marque etapas avulsas.
          </p>

          {hasExistingPlan && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              Substituir plano atual do projeto
            </label>
          )}

          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGroup(g.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  activeGroupId === g.id
                    ? "border-brand-orange bg-brand-orange/15 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                {g.name} ({g.items.length})
              </button>
            ))}
          </div>

          {activeGroup && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={pending || activeItems.length === 0}
              onClick={importWholeArea}
            >
              Importar área inteira: {activeGroup.name}
            </Button>
          )}

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="text-brand-orange hover:underline"
              onClick={selectAllInGroup}
            >
              Marcar todas desta área
            </button>
          </div>

          <ul className="max-h-[280px] space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {activeItems.length === 0 ? (
              <li className="p-4 text-center text-sm text-muted-foreground">
                Esta área não tem etapas.
              </li>
            ) : (
              activeItems.map((c) => (
                <li key={c.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/50",
                      selected.has(c.id) && "bg-muted/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.estimated_days}d · {deliverableTypeLabels[c.deliverable_type]}
                        {c.predecessor && ` · após ${c.predecessor.name}`}
                      </span>
                    </span>
                  </label>
                </li>
              ))
            )}
          </ul>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pending || selected.size === 0}
              onClick={importSelected}
            >
              Importar selecionadas ({selected.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
