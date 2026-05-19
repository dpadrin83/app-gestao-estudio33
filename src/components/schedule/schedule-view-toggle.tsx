"use client";

import { cn } from "@/lib/utils";

export type ScheduleViewMode = "table" | "classic" | "swimlanes";

const modes: { id: ScheduleViewMode; label: string }[] = [
  { id: "table", label: "Tabela editável" },
  { id: "classic", label: "Gantt clássico" },
  { id: "swimlanes", label: "Por fase" },
];

export function ScheduleViewToggle({
  mode,
  onChange,
}: {
  mode: ScheduleViewMode;
  onChange: (mode: ScheduleViewMode) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-border bg-card/50 p-1">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            mode === m.id
              ? "bg-brand-purple text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
