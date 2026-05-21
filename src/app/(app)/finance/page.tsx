import Link from "next/link";
import { Suspense } from "react";
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
import { FinanceFilters } from "@/components/finance/finance-filters";
import { FinanceExportButton } from "@/components/finance/finance-export-button";
import { PaymentStatusBadge } from "@/components/finance/payment-status-badge";
import { MarginBadge } from "@/components/finance/margin-badge";
import { getFinancePageData } from "@/lib/queries/finance-overview";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { FinanceOverviewRow } from "@/lib/queries/finance-overview";
import type { PaymentStatus } from "@/types/database";

function filterRows(
  rows: FinanceOverviewRow[],
  params: { payment?: string; margin?: string; client?: string },
): FinanceOverviewRow[] {
  return rows.filter((r) => {
    if (params.payment && params.payment !== "all" && r.paymentStatus !== params.payment) {
      return false;
    }
    if (params.client && params.client !== "all" && r.clientId !== params.client) {
      return false;
    }
    if (params.margin === "negative" && r.margin >= 0) return false;
    if (params.margin === "risk" && !r.marginAtRisk) return false;
    return true;
  });
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; margin?: string; client?: string }>;
}) {
  const params = await searchParams;
  const data = await getFinancePageData();
  const filtered = filterRows(data.rows, params);

  const totals = filtered.reduce(
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
        description={`Orçamento, recebíveis, custos, margem e arquivos. Alerta de margem abaixo de ${data.marginAlertPercent}%.`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="p-4 border-brand-orange/30">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            A faturar
          </p>
          <p className="mt-2 font-mono text-xl font-bold">
            {formatCurrency(data.receivables.toInvoice)}
          </p>
        </Card>
        <Card className="p-4 border-brand-blue/30">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Faturado (em aberto)
          </p>
          <p className="mt-2 font-mono text-xl font-bold">
            {formatCurrency(data.receivables.invoicedOpen)}
          </p>
        </Card>
        <Card className="p-4 border-success/30">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Recebido no mês
          </p>
          <p className="mt-2 font-mono text-xl font-bold text-success">
            {formatCurrency(data.receivables.receivedThisMonth)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Orçamento (filtro)
          </p>
          <p className="mt-2 font-mono text-xl font-bold">{formatCurrency(totals.budget)}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Custos + horas
          </p>
          <p className="mt-2 font-mono text-xl font-bold">{formatCurrency(totals.spent)}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Margem (filtro)
          </p>
          <p
            className={`mt-2 font-mono text-xl font-bold ${
              totals.margin < 0 ? "text-destructive" : "text-success"
            }`}
          >
            {formatCurrency(totals.margin)}
          </p>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Top clientes (recebido)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Por valor de projetos com status recebido.
          </p>
          {data.topClients.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem recebimentos registrados.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.topClients.map((c, i) => (
                <li key={c.clientId} className="flex items-center justify-between gap-2">
                  <span className="text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {i + 1}.
                    </span>{" "}
                    {c.clientName}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({c.projectCount} proj.)
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {formatCurrency(c.revenueReceived)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Ticket médio por área</h2>
          {data.ticketsByLine.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Defina a área E33 nos projetos para ver médias.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.ticketsByLine.map((t) => (
                <li
                  key={t.serviceLine}
                  className="flex justify-between gap-2 text-sm"
                >
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(t.avgContract)}
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({t.projectCount})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {data.atRisk.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5 p-5">
          <h2 className="text-sm font-semibold text-warning">
            Em risco financeiro ({data.atRisk.length})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Margem abaixo de {data.marginAlertPercent}% — ajuste em Configurações.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.atRisk.slice(0, 8).map((r) => (
              <li key={r.projectId}>
                <Link
                  href={`/projects/${r.projectId}#financeiro`}
                  className="inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-background/60 px-3 py-1.5 text-sm hover:bg-background"
                >
                  {r.projectName}
                  <MarginBadge percent={r.marginPercent} atRisk />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={null}>
          <FinanceFilters clients={data.clients} />
        </Suspense>
        <FinanceExportButton rows={filtered} />
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
              <TableHead>%</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Recebido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhum projeto neste filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
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
                  <TableCell>
                    <MarginBadge percent={r.marginPercent} atRisk={r.marginAtRisk} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={r.paymentStatus as PaymentStatus} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.receivedAt ? formatDateShort(r.receivedAt) : "—"}
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
