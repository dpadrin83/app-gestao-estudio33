"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ScheduleFilters({
  clients,
  selectedClientId,
}: {
  clients: { id: string; name: string }[];
  selectedClientId?: string;
}) {
  const router = useRouter();

  return (
    <div className="mb-6 max-w-xs">
      <Select
        value={selectedClientId ?? "all"}
        onValueChange={(v) => {
          if (!v) return;
          const params = new URLSearchParams();
          if (v !== "all") params.set("client", v);
          const q = params.toString();
          router.push(q ? `/schedule?${q}` : "/schedule");
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filtrar por cliente" />
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
    </div>
  );
}
