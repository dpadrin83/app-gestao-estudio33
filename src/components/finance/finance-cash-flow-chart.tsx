import { formatCurrency } from "@/lib/format";
import type { FinanceCashFlow } from "@/lib/queries/finance-overview";
import { cn } from "@/lib/utils";

export function FinanceCashFlowChart({ cashFlow }: { cashFlow: FinanceCashFlow }) {
  const max = Math.max(
    ...cashFlow.months.flatMap((m) => [m.inflow, m.outflow]),
    1,
  );

  return (
    <div className="card-glass card-finance-tint rounded-3xl p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Fluxo de caixa · {cashFlow.year}
          </p>
          <h2 className="text-lg font-semibold tracking-tight">
            Entradas vs saídas
          </h2>
        </div>
        <div className="flex gap-4 font-mono text-[10px] uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" />
            Entrada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive/80" />
            Saída
          </span>
        </div>
      </div>

      <div className="grid h-[140px] grid-cols-12 items-end gap-1">
        {cashFlow.months.map((m) => {
          const inH = Math.max(6, Math.round((m.inflow / max) * 100));
          const outH = Math.max(6, Math.round((m.outflow / max) * 100));
          return (
            <div
              key={m.key}
              className="flex h-full flex-col items-center justify-end gap-0.5"
            >
              <div className="flex w-full items-end justify-center gap-px">
                <div
                  className={cn(
                    "w-[42%] min-w-[3px] rounded-t-sm bg-success/85",
                    m.isCurrent && "ring-1 ring-success/50",
                  )}
                  style={{ height: `${inH}%` }}
                  title={`Entrada: ${formatCurrency(m.inflow)}`}
                />
                <div
                  className={cn(
                    "w-[42%] min-w-[3px] rounded-t-sm bg-destructive/70",
                    m.isCurrent && "ring-1 ring-destructive/40",
                  )}
                  style={{ height: `${outH}%` }}
                  title={`Saída: ${formatCurrency(m.outflow)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-12 gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
        {cashFlow.months.map((m) => (
          <span
            key={`lbl-${m.key}`}
            className={cn("text-center", m.isCurrent && "font-bold text-brand-yellow")}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
        {cashFlow.months
          .filter((m) => m.isCurrent)
          .map((m) => (
            <div key={m.key} className="rounded-lg bg-background/40 px-3 py-2">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                Resultado {m.label}
              </p>
              <p
                className={cn(
                  "font-mono text-lg font-bold",
                  m.net >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatCurrency(m.net)}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
