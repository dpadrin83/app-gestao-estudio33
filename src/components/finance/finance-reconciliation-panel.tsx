import { Landmark, Upload, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Placeholder para conciliação bancária (OFX/CSV) — Fase B. */
export function FinanceReconciliationPanel() {
  return (
    <Card className="flex h-full flex-col border-dashed border-brand-blue/30 bg-brand-blue/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2 text-brand-blue">
        <Landmark className="size-5" />
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Conciliação bancária
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Importe o extrato do banco (OFX ou CSV) e cruze com recebimentos e custos já
        lançados no Hub. Previsto na próxima fase do financeiro.
      </p>

      <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Link2 className="size-3.5 shrink-0" />
          Match automático por valor + data
        </li>
        <li className="flex items-center gap-2">
          <Upload className="size-3.5 shrink-0" />
          Upload de extrato sem duplicar lançamentos
        </li>
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button type="button" variant="outline" disabled className="w-full justify-start">
          <Upload className="size-4" />
          Importar extrato (em breve)
        </Button>
        <p className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Enquanto isso: use o extrato abaixo como caixa operacional
        </p>
      </div>
    </Card>
  );
}
