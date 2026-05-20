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
import { importCatalogToProject } from "@/lib/actions/deliverable-catalog";
import { serviceLineLabels, deliverableTypeLabels } from "@/lib/format";
import type { DeliverableCatalogItem, ServiceLine } from "@/types/database";
import { cn } from "@/lib/utils";

export function ImportCatalogDialog({
  projectId,
  catalog,
  projectServiceLine,
  hasExistingPlan,
}: {
  projectId: string;
  catalog: DeliverableCatalogItem[];
  projectServiceLine: ServiceLine | null;
  hasExistingPlan: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [replace, setReplace] = useState(false);

  const filtered = projectServiceLine
    ? catalog.filter(
        (c) => !c.service_line || c.service_line === projectServiceLine,
      )
    : catalog;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((c) => c.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function importSelected() {
    startTransition(async () => {
      const result = await importCatalogToProject(
        projectId,
        [...selected],
        { replaceExisting: replace },
      );
      if (result.ok) {
        toast.success(
          `${result.data?.count ?? 0} etapa(s) importadas para o projeto.`,
        );
        setOpen(false);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={catalog.length === 0}
        onClick={() => {
          setSelected(new Set(filtered.map((c) => c.id)));
          setOpen(true);
        }}
      >
        <Download className="size-4" />
        Importar do catálogo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar etapas do catálogo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Marque o que entra neste projeto. Dependências anteriores entram
            automaticamente.
            {projectServiceLine && (
              <>
                {" "}
                Filtrado para{" "}
                <strong>{serviceLineLabels[projectServiceLine]}</strong>.
              </>
            )}
          </p>

          {hasExistingPlan && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              Substituir entregáveis já no plano deste projeto
            </label>
          )}

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="text-brand-orange hover:underline"
              onClick={selectAll}
            >
              Marcar todos
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:underline"
              onClick={clearAll}
            >
              Limpar
            </button>
          </div>

          <ul className="max-h-[320px] space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {filtered.length === 0 ? (
              <li className="p-4 text-center text-sm text-muted-foreground">
                Nada no catálogo.
                <a
                  href="/catalog/deliverables"
                  className="mt-1 block text-brand-orange hover:underline"
                >
                  Abrir catálogo
                </a>
              </li>
            ) : (
              filtered.map((c) => (
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
              Importar {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
