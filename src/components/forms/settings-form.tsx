"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHourlyRate, updateMarginAlertPercent } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export function SettingsForm({
  hourlyRate,
  marginAlertPercent,
}: {
  hourlyRate: number;
  marginAlertPercent: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rateRaw = String(fd.get("hourly_rate") ?? "").replace(",", ".");
    const marginRaw = String(fd.get("margin_alert_percent") ?? "").replace(",", ".");
    const rate = Number(rateRaw);
    const margin = Number(marginRaw);

    startTransition(async () => {
      const [rateResult, marginResult] = await Promise.all([
        updateHourlyRate(rate),
        updateMarginAlertPercent(margin),
      ]);
      if (rateResult.ok && marginResult.ok) {
        toast.success("Configurações financeiras atualizadas.");
        router.refresh();
      } else if (!rateResult.ok) {
        toast.error(rateResult.error);
      } else if (!marginResult.ok) {
        toast.error(marginResult.error);
      }
    });
  }

  return (
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Financeiro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Parâmetros usados na margem e nos alertas do dashboard e /finance.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourly_rate">Taxa horária (R$/hora)</Label>
          <Input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            step="1"
            min="1"
            defaultValue={String(hourlyRate)}
          />
          <p className="text-xs text-muted-foreground">
            Atual: {formatCurrency(hourlyRate)}/h — horas do timer × taxa.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin_alert_percent">Alerta de margem mínima (%)</Label>
          <Input
            id="margin_alert_percent"
            name="margin_alert_percent"
            type="number"
            step="1"
            min="0"
            max="100"
            defaultValue={String(marginAlertPercent)}
          />
          <p className="text-xs text-muted-foreground">
            Projetos com margem % abaixo deste valor aparecem em risco.
          </p>
        </div>

        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}
