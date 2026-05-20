"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dashboardPath } from "@/lib/app-paths";
import type { PortfolioGanttSort } from "@/lib/queries/portfolio-gantt";

export function PortfolioGanttControls({
  clients,
  selectedClientId,
  selectedSort,
}: {
  clients: { id: string; name: string }[];
  selectedClientId?: string;
  selectedSort: PortfolioGanttSort;
}) {
  const router = useRouter();

  function pushParams(patch: { client?: string; sort?: PortfolioGanttSort }) {
    const nextClient =
      patch.client !== undefined
        ? patch.client === "all"
          ? undefined
          : patch.client
        : selectedClientId;
    const nextSort = patch.sort ?? selectedSort;
    router.push(dashboardPath({ clientId: nextClient, sort: nextSort }));
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <Select
        value={selectedClientId ?? "all"}
        onValueChange={(v) => {
          if (v) pushParams({ client: v });
        }}
      >
        <SelectTrigger className="w-full min-w-[180px] max-w-xs">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os clientes</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedSort}
        onValueChange={(v) => {
          if (v) pushParams({ sort: v as PortfolioGanttSort });
        }}
      >
        <SelectTrigger className="w-full min-w-[180px] max-w-xs">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="days">Prazo · mais longo primeiro</SelectItem>
          <SelectItem value="overdue">Atrasados primeiro</SelectItem>
          <SelectItem value="progress">Maior progresso</SelectItem>
          <SelectItem value="name">Nome A–Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
