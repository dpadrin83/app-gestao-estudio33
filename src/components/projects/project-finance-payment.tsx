"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  ProjectFinancePaymentSchema,
  type ProjectFinancePaymentFormValues,
} from "@/lib/schemas/project-finance-payment";
import { updateProjectFinancePayment } from "@/lib/actions/finance";
import { paymentStatusLabels } from "@/lib/format";
import { MarginBadge } from "@/components/finance/margin-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentStatus } from "@/types/database";

const statusHints: Record<PaymentStatus, string> = {
  to_invoice: "Contrato fechado — ainda não emitiu NF.",
  invoiced: "NF emitida — aguardando pagamento do cliente.",
  received: "Valor recebido — entra no fluxo de caixa do mês.",
};

export function ProjectFinancePayment({
  projectId,
  contractValue,
  paymentStatus,
  invoicedAt,
  receivedAt,
  marginPercent,
  marginAtRisk,
  marginAlertPercent,
}: {
  projectId: string;
  contractValue: number | null;
  paymentStatus: PaymentStatus;
  invoicedAt: string | null;
  receivedAt: string | null;
  marginPercent: number | null;
  marginAtRisk: boolean;
  marginAlertPercent: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const defaults: ProjectFinancePaymentFormValues = {
    contract_value:
      contractValue != null ? String(contractValue) : "",
    payment_status: paymentStatus,
    invoiced_at: invoicedAt ?? "",
    received_at: receivedAt ?? "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFinancePaymentFormValues>({
    resolver: zodResolver(ProjectFinancePaymentSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset({
      contract_value:
        contractValue != null ? String(contractValue) : "",
      payment_status: paymentStatus,
      invoiced_at: invoicedAt ?? "",
      received_at: receivedAt ?? "",
    });
  }, [contractValue, paymentStatus, invoicedAt, receivedAt, reset]);

  const currentStatus = watch("payment_status");

  function onSubmit(values: ProjectFinancePaymentFormValues) {
    startTransition(async () => {
      const result = await updateProjectFinancePayment(projectId, values);
      if (result.ok) {
        toast.success("Financeiro do projeto atualizado.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function quickStatus(status: PaymentStatus) {
    const values = watch();
    startTransition(async () => {
      const result = await updateProjectFinancePayment(projectId, {
        ...values,
        payment_status: status,
      });
      if (result.ok) {
        toast.success(`Status: ${paymentStatusLabels[status]}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 text-brand-yellow" />
          <div>
            <h3 className="text-sm font-semibold">Contrato e recebíveis</h3>
            <p className="text-xs text-muted-foreground">
              Lançamento do dia a dia — valor, status e datas nesta aba.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Margem · alerta &lt; {marginAlertPercent}%
          </p>
          <MarginBadge percent={marginPercent} atRisk={marginAtRisk} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          Object.entries(paymentStatusLabels) as [PaymentStatus, string][]
        ).map(([status, label]) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={currentStatus === status ? "default" : "outline"}
            disabled={pending}
            onClick={() => quickStatus(status)}
          >
            {label}
          </Button>
        ))}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        {statusHints[currentStatus]}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end"
      >
        <div className="space-y-2 lg:col-span-1">
          <Label htmlFor="fin-contract_value">Valor do contrato (R$)</Label>
          <Input
            id="fin-contract_value"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register("contract_value")}
          />
          {errors.contract_value && (
            <p className="text-xs text-destructive">
              {errors.contract_value.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status de pagamento</Label>
          <Controller
            control={control}
            name="payment_status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fin-invoiced_at">Data faturamento</Label>
          <Input id="fin-invoiced_at" type="date" {...register("invoiced_at")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fin-received_at">Data recebimento</Label>
          <Input id="fin-received_at" type="date" {...register("received_at")} />
        </div>

        <Button type="submit" disabled={pending} className="lg:col-span-4 lg:w-auto">
          <Save className="size-4" />
          {pending ? "Salvando…" : "Salvar financeiro"}
        </Button>
      </form>
    </Card>
  );
}
