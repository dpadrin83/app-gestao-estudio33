"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentStatusLabels } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FinanceFilters({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function hrefFor(updates: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v || v === "all") p.delete(k);
      else p.set(k, v);
    }
    const q = p.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  const payment = searchParams.get("payment") ?? "all";
  const margin = searchParams.get("margin") ?? "all";
  const client = searchParams.get("client") ?? "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={payment}
        onValueChange={(v) => router.push(hrefFor({ payment: v }))}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos pagamentos</SelectItem>
          {Object.entries(paymentStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={margin}
        onValueChange={(v) => router.push(hrefFor({ margin: v }))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Margem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas margens</SelectItem>
          <SelectItem value="negative">Margem negativa</SelectItem>
          <SelectItem value="risk">Abaixo do limite</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={client}
        onValueChange={(v) => router.push(hrefFor({ client: v }))}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos clientes</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(payment !== "all" || margin !== "all" || client !== "all") && (
        <Link
          href={pathname}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Limpar filtros
        </Link>
      )}

      <div className="ml-auto flex gap-2">
        {(["all", "negative", "risk"] as const).map((m) => (
          <Link
            key={m}
            href={hrefFor({ margin: m === "all" ? null : m })}
            className={cn(
              "rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
              (margin === m || (m === "all" && margin === "all"))
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {m === "all" ? "Todas" : m === "negative" ? "Negativa" : "Em risco"}
          </Link>
        ))}
      </div>
    </div>
  );
}
