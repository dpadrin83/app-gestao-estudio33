import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { FinanceLedgerEntry } from "@/lib/queries/finance-overview";
import { cn } from "@/lib/utils";

const categoryLabels = {
  recebimento: "Recebimento",
  custo: "Custo",
  mao_de_obra: "Mão de obra",
} as const;

export function FinanceLedger({ entries }: { entries: FinanceLedgerEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
      <div className="border-b border-border px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Extrato
        </p>
        <h2 className="text-lg font-semibold tracking-tight">Movimentações</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Recebimentos, custos lançados e mão de obra (horas × taxa). Ordenado por data.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                Nenhuma movimentação registrada. Lance custos ou marque recebimentos nos
                projetos.
              </TableCell>
            </TableRow>
          ) : (
            entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {formatDateShort(e.date)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase",
                      e.type === "credit"
                        ? "border-success/35 bg-success/10 text-success"
                        : "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    {e.type === "credit" ? "Crédito" : "Débito"}
                  </span>
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    {categoryLabels[e.category]}
                  </span>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-sm">
                  {e.description}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/projects/${e.projectId}#financeiro`}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {e.projectName}
                  </Link>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-sm font-semibold",
                    e.type === "credit" ? "text-success" : "text-destructive",
                  )}
                >
                  {e.type === "credit" ? "+" : "−"}
                  {formatCurrency(e.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
