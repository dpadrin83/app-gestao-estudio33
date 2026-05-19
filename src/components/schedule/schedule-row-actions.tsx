"use client";

import { Button } from "@/components/ui/button";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScheduleRowActions({
  busy,
  completed,
  onComplete,
  onAddSubtask,
  onEdit,
  onDelete,
  showComplete = true,
  showAddSubtask = true,
  className,
}: {
  busy?: boolean;
  completed?: boolean;
  onComplete?: () => void;
  onAddSubtask?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showComplete?: boolean;
  showAddSubtask?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-0.5 whitespace-nowrap",
        className,
      )}
    >
      {showComplete && onComplete && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Concluir"
          disabled={busy || completed}
          onClick={onComplete}
        >
          <Check className="size-3.5 text-success" />
        </Button>
      )}
      {showAddSubtask && onAddSubtask && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Subtarefa"
          disabled={busy}
          onClick={onAddSubtask}
        >
          <Plus className="size-3.5 text-muted-foreground" />
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Editar"
          onClick={onEdit}
        >
          <Pencil className="size-3.5 text-muted-foreground" />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Excluir"
          disabled={busy}
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
