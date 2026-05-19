"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientListFilter } from "@/lib/actions/clients";

const tabs: { value: ClientListFilter; label: string }[] = [
  { value: "operational", label: "Em operação" },
  { value: "prospect", label: "Prospectos" },
  { value: "active", label: "Ativos" },
  { value: "paused", label: "Em pausa" },
  { value: "closed", label: "Encerrados" },
  { value: "inactive", label: "Arquivados" },
  { value: "all", label: "Todos" },
];

export function ClientFilters({
  initialStatus,
  initialQ,
}: {
  initialStatus: ClientListFilter;
  initialQ: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      startTransition(() => router.replace(`/clients?${next.toString()}`));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setStatus(value: ClientListFilter) {
    const next = new URLSearchParams(params.toString());
    next.set("status", value);
    startTransition(() => router.replace(`/clients?${next.toString()}`));
  }

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa, contato, CNPJ, e-mail…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
        {tabs.map((tab) => {
          const active = initialStatus === tab.value;
          return (
            <Button
              key={tab.value}
              size="sm"
              variant="ghost"
              onClick={() => setStatus(tab.value)}
              className={cn(
                "h-7 px-2.5 text-xs",
                active && "bg-secondary text-foreground",
              )}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
