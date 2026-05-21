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
import { FinanceRowPayment } from "@/components/finance/finance-row-payment";
import { FinanceCashFlowChart } from "@/components/finance/finance-cash-flow-chart";
import { FinanceLedger } from "@/components/finance/finance-ledger";
import { FinanceReconciliationPanel } from "@/components/finance/finance-reconciliation-panel";
import { FinanceReceivablesPipeline } from "@/components/finance/finance-receivables-pipeline";
import { StudioCashEntryPanel } from "@/components/finance/studio-cash-entry-panel";
import { MarginBadge } from "@/components/finance/margin-badge";
import { getFinancePageData } from "@/lib/queries/finance-overview";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { FinanceOverviewRow } from "@/lib/queries/finance-overview";
import type { PaymentStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from "lucide-react";

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
  const { cashFlow } = data;
  const pipelineTotal =
    data.receivables.toInvoice +
    data.receivables.invoicedOpen +
    data.receivables.receivedThisMonth;

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Fluxo de caixa"
        description="Caixa do estúdio: lance gastos de cartão e operacional aqui; recebimentos e custos de job na aba Financeiro de cada projeto."
      />

      <div className="mb-6">
        <StudioCashEntryPanel
          movements={data.studioMovements}
          projectOptions={data.projectOptions}
        />
      </div>

      {/* KPIs — cara de sistema financeiro */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-brand-yellow/30 bg-brand-yellow/[0.06] p-5">
          <div className="flex items-start justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Resultado do mês
            </p>
            <PiggyBank className="size-4 text-brand-yellow" />
          </div>
          <p
            className={cn(
              "mt-2 font-mono text-2xl font-bold",
              cashFlow.monthNet >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {formatCurrency(cashFlow.monthNet)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Entradas − saídas (caixa operacional)
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Entradas no mês
            </p>
            <TrendingUp className="size-4 text-success" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-success">
            {formatCurrency(cashFlow.monthInflow)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            YTD {formatCurrency(cashFlow.ytdInflow)}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Saídas no mês
            </p>
            <TrendingDown className="size-4 text-destructive" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-destructive">
            {formatCurrency(cashFlow.monthOutflow)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            YTD {formatCurrency(cashFlow.ytdOutflow)}
          </p>
        </Card>

        <Card className="border-brand-purple/25 p-5">
          <div className="flex items-start justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              A receber (pipeline)
            </p>
            <Wallet className="size-4 text-brand-purple" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold">
            {formatCurrency(pipelineTotal)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Contratado ainda não no caixa
          </p>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinanceCashFlowChart cashFlow={cashFlow} />
        </div>
        <FinanceReconciliationPanel />
      </div>

      <div className="mb-6">
        <FinanceReceivablesPipeline receivables={data.receivables} />
      </div>

      <div className="mb-8">
        <FinanceLedger entries={data.ledger} />
      </div>

      {data.atRisk.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5 p-5">
          <h2 className="text-sm font-semibold text-warning">
            Rentabilidade em risco ({data.atRisk.length})
          </h2>
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

      <div className="mb-4 rounded-2xl border border-border bg-muted/20 px-5 py-4">
        <h2 className="text-sm font-semibold">Análise por projeto</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Margem e status de cobrança — operação detalhada. Lançamentos em cada projeto →
          Financeiro.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Suspense fallback={null}>
            <FinanceFilters clients={data.clients} />
          </Suspense>
          <FinanceExportButton rows={filtered} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Contrato</TableHead>
              <TableHead className="text-right">Saídas</TableHead>
              <TableHead className="text-right">Resultado</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Cobrança</TableHead>
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
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(r.budget)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive/90">
                    {formatCurrency(r.costsTotal + r.laborCost)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-sm font-semibold",
                      r.margin < 0 ? "text-destructive" : "text-success",
                    )}
                  >
                    {formatCurrency(r.margin)}
                  </TableCell>
                  <TableCell>
                    <MarginBadge percent={r.marginPercent} atRisk={r.marginAtRisk} />
                  </TableCell>
                  <TableCell>
                    <FinanceRowPayment
                      projectId={r.projectId}
                      status={r.paymentStatus as PaymentStatus}
                    />
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
