import { formatCurrency } from "@/lib/format";
import type { FinanceReceivablesSummary } from "@/lib/queries/finance-overview";
import { cn } from "@/lib/utils";

export function FinanceReceivablesPipeline({
  receivables,
}: {
  receivables: FinanceReceivablesSummary;
}) {
  const total =
    receivables.toInvoice + receivables.invoicedOpen + receivables.receivedThisMonth;

  const stages = [
    {
      key: "to_invoice",
      label: "A faturar",
      value: receivables.toInvoice,
      color: "border-brand-orange/40 bg-brand-orange/10",
      bar: "bg-brand-orange",
    },
    {
      key: "invoiced",
      label: "Faturado (aberto)",
      value: receivables.invoicedOpen,
      color: "border-brand-blue/40 bg-brand-blue/10",
      bar: "bg-brand-blue",
    },
    {
      key: "received",
      label: "Recebido no mês",
      value: receivables.receivedThisMonth,
      color: "border-success/40 bg-success/10",
      bar: "bg-success",
    },
  ] as const;

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Contas a receber
      </p>
      <h2 className="text-lg font-semibold tracking-tight">Pipeline de recebíveis</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Posição contratada por estágio — não substitui saldo bancário até conciliar.
      </p>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted">
        {stages.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 33.33;
          return (
            <div
              key={s.key}
              className={cn("h-full transition-all", s.bar)}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${formatCurrency(s.value)}`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {stages.map((s) => (
          <div key={s.key} className={cn("rounded-xl border p-4", s.color)}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 font-mono text-xl font-bold">{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
