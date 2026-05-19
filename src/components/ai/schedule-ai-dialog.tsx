"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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
  suggestScheduleFromText,
  applySuggestedSchedule,
  type SuggestedActivity,
} from "@/lib/actions/ai";
import { activityPhaseLabels } from "@/lib/format";

export function ScheduleAiDialog({
  projectId,
  disabled,
  aiConfigured,
}: {
  projectId: string;
  disabled: boolean;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedActivity[] | null>(
    null,
  );

  function handleSuggest() {
    if (!description.trim()) {
      toast.error("Descreva o projeto em texto livre.");
      return;
    }
    startTransition(async () => {
      const result = await suggestScheduleFromText(projectId, description);
      if (result.ok && result.data) {
        setSuggestions(result.data.activities);
        toast.success(`${result.data.activities.length} atividades sugeridas.`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function handleApply() {
    if (!suggestions?.length) return;
    startTransition(async () => {
      const result = await applySuggestedSchedule(projectId, suggestions);
      if (result.ok) {
        toast.success(`Cronograma criado (${result.data?.count} atividades).`);
        setOpen(false);
        setSuggestions(null);
        setDescription("");
        router.refresh();
      } else if (!result.ok) {
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
        onClick={() => setOpen(true)}
        disabled={disabled || !aiConfigured}
      >
        <Sparkles className="size-4" />
        Cronograma com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sugerir cronograma com IA</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Descreva o projeto (tipo, etapas, prazos). A IA monta uma lista de
            atividades encadeadas. Só funciona em projetos sem atividades.
          </p>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Ex.: Vídeo institucional 2 min — roteiro, gravação, edição, revisão cliente, entrega final..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {suggestions && (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-3 text-sm">
              {suggestions.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-muted-foreground">{i + 1}.</span>
                  <span>
                    {a.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({activityPhaseLabels[a.phase]}, {a.estimated_duration_days}d)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            {!suggestions ? (
              <Button onClick={handleSuggest} disabled={pending}>
                {pending ? "Gerando…" : "Sugerir"}
              </Button>
            ) : (
              <Button onClick={handleApply} disabled={pending}>
                {pending ? "Aplicando…" : "Aplicar ao projeto"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
