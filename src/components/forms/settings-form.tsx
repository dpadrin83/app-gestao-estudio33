"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHourlyRate } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export function SettingsForm({ hourlyRate }: { hourlyRate: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("hourly_rate") ?? "").replace(",", ".");
    const value = Number(raw);
    startTransition(async () => {
      const result = await updateHourlyRate(value);
      if (result.ok) {
        toast.success("Taxa horária atualizada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Taxa horária padrão</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usada no financeiro para calcular mão de obra (horas do timer × esta taxa).
            Valor atual: {formatCurrency(hourlyRate)}/h
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hourly_rate">Nova taxa (R$/hora)</Label>
          <Input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            step="1"
            min="1"
            defaultValue={String(hourlyRate)}
          />
        </div>
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}
