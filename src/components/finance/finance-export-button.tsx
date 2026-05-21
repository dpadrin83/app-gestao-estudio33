"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentStatusLabels } from "@/lib/format";
import type { FinanceOverviewRow } from "@/lib/queries/finance-overview";

function escapeCsv(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function FinanceExportButton({ rows }: { rows: FinanceOverviewRow[] }) {
  function exportCsv() {
    const header = [
      "Projeto",
      "Cliente",
      "Orçamento",
      "Custos",
      "Mão de obra",
      "Margem",
      "Margem %",
      "Pagamento",
      "Faturado em",
      "Recebido em",
    ];
    const lines = rows.map((r) =>
      [
        r.projectName,
        r.clientName,
        r.budget,
        r.costsTotal,
        r.laborCost,
        r.margin,
        r.marginPercent ?? "",
        paymentStatusLabels[r.paymentStatus],
        r.invoicedAt ?? "",
        r.receivedAt ?? "",
      ]
        .map(escapeCsv)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-e33-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
      <Download className="size-4" />
      Exportar CSV
    </Button>
  );
}
