"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, FileImage, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PortfolioGanttExport({ targetId }: { targetId: string }) {
  const [busy, setBusy] = useState<"png" | "print" | null>(null);

  async function exportPng() {
    setBusy("png");
    try {
      const el = document.getElementById(targetId);
      if (!el) {
        toast.error("Área do Gantt não encontrada.");
        return;
      }
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, {
        backgroundColor: "#0B0D12",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `gantt-portfolio-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("PNG exportado.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o PNG.");
    } finally {
      setBusy(null);
    }
  }

  function exportPrint() {
    setBusy("print");
    window.print();
    setTimeout(() => setBusy(null), 500);
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="font-mono text-[10px] uppercase tracking-wider"
        disabled={busy !== null}
        onClick={() => void exportPng()}
      >
        <FileImage className="size-3.5" />
        PNG
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="font-mono text-[10px] uppercase tracking-wider"
        disabled={busy !== null}
        onClick={exportPrint}
      >
        <Printer className="size-3.5" />
        PDF / imprimir
      </Button>
      <span className="hidden items-center gap-1 self-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
        <Download className="size-3" />
        borda direita da barra · ajustar prazo
      </span>
    </div>
  );
}
