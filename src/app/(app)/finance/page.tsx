import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listFinanceOverview } from "@/lib/actions/finance";
import { formatCurrency, paymentStatusLabels } from "@/lib/format";
import Link from "next/link";

export default async function FinancePage() {
  const rows = await listFinanceOverview();

  const totals = rows.reduce(
    (acc, r) => {
      acc.budget += r.budget;
      acc.spent += r.costsTotal + r.laborCost;
      acc.margin += r.margin;
      if (r.margin < 0) acc.negative += 1;
      return acc;
    },
    { budget: 0, spent: 0, margin: 0, negative: 0 },
  );

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Visão por projeto"
        description="Orçamento, custos lançados e margem estimada (inclui horas × taxa/hora)."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Orçamento total
          </p>
          <p className="mt-2 font-mono text-2xl font-bold">
            {formatCurrency(totals.budget)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Custos + horas
          </p>
          <p className="mt-2 font-mono text-2xl font-bold">
            {formatCurrency(totals.spent)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Margem estimada
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-bold ${
              totals.margin < 0 ? "text-destructive" : "text-success"
            }`}
          >
            {formatCurrency(totals.margin)}
          </p>
          {totals.negative > 0 && (
            <p className="mt-1 text-xs text-warning">
              {totals.negative} projeto(s) com margem negativa
            </p>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Custos</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead>Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum projeto ativo.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.projectId}>
                  <TableCell>
                    <Link
                      href={`/projects/${r.projectId}#financeiro`}
                      className="font-medium hover:underline"
                    >
                      {r.projectName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.clientName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(r.budget)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(r.costsTotal + r.laborCost)}
                  </TableCell>
                  <TableCell
                    className={`font-mono text-sm font-semibold ${
                      r.margin < 0 ? "text-destructive" : "text-success"
                    }`}
                  >
                    {formatCurrency(r.margin)}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] uppercase">
                    {paymentStatusLabels[
                      r.paymentStatus as keyof typeof paymentStatusLabels
                    ] ?? r.paymentStatus}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
