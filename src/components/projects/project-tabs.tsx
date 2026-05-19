"use client";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "dados", label: "Dados" },
  { id: "cronograma", label: "Cronograma" },
  { id: "plano-entregas", label: "Plano por área" },
  { id: "tarefas", label: "Tarefas" },
  { id: "entregaveis", label: "Entregáveis" },
  { id: "financeiro", label: "Financeiro" },
  { id: "links", label: "Links" },
  { id: "atividade", label: "Atividade" },
] as const;

export function ProjectTabs() {
  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-border pb-px">
      {TABS.map((tab) => (
        <a
          key={tab.id}
          href={`#${tab.id}`}
          className={cn(
            "shrink-0 rounded-t-md px-3 py-2 text-sm font-medium text-muted-foreground transition",
            "hover:bg-muted/50 hover:text-foreground",
          )}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
