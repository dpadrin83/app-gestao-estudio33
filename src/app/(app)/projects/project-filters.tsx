"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { projectStatusLabels } from "@/lib/format";
import type { ProjectStatus } from "@/types/database";

export function ProjectFilters({
  initialStatus,
  initialClient,
  allStatus,
  clientOptions,
}: {
  initialStatus: ProjectStatus[];
  initialClient: string;
  allStatus: ProjectStatus[];
  clientOptions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function updateUrl(next: URLSearchParams) {
    startTransition(() => router.replace(`/projects?${next.toString()}`));
  }

  function toggleStatus(s: ProjectStatus) {
    const set = new Set(initialStatus);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    const next = new URLSearchParams(params.toString());
    if (set.size === 0 || set.size === allStatus.length) {
      next.delete("status");
    } else {
      next.set("status", Array.from(set).join(","));
    }
    updateUrl(next);
  }

  function setClient(value: string | null) {
    if (!value) return;
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete("client");
    else next.set("client", value);
    updateUrl(next);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Status:
        </span>
        {allStatus.map((s) => {
          const active = initialStatus.includes(s);
          return (
            <Button
              key={s}
              size="sm"
              variant="outline"
              onClick={() => toggleStatus(s)}
              className={cn(
                "h-7 rounded-full border px-3 text-xs",
                active
                  ? "border-foreground/40 bg-secondary text-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {projectStatusLabels[s]}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Cliente:
        </span>
        <Select value={initialClient} onValueChange={setClient}>
          <SelectTrigger className="h-8 w-[200px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clientOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
