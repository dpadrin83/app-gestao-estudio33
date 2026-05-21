"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  StudioCashMovementSchema,
  type StudioCashMovementFormValues,
} from "@/lib/schemas/studio-cash-movement";
import {
  createStudioCashMovement,
  deleteStudioCashMovement,
} from "@/lib/actions/studio-cash-movements";
import {
  formatCurrency,
  formatDateShort,
  studioCashCategoryLabels,
} from "@/lib/format";
import type { StudioCashMovement } from "@/types/database";
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
import { cn } from "@/lib/utils";

export function StudioCashEntryPanel({
  movements,
  projectOptions,
}: {
  movements: StudioCashMovement[];
  projectOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StudioCashMovementFormValues>({
    resolver: zodResolver(StudioCashMovementSchema),
    defaultValues: {
      movement_type: "out",
      amount: "",
      occurred_at: today,
      description: "",
      category: "card",
      project_id: "",
      notes: "",
    },
  });

  function onSubmit(values: StudioCashMovementFormValues) {
    startTransition(async () => {
      const result = await createStudioCashMovement(values);
      if (result.ok) {
        toast.success("Lançamento registrado no caixa.");
        reset({
          movement_type: "out",
          amount: "",
          occurred_at: today,
          description: "",
          category: "card",
          project_id: "",
          notes: "",
        });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir este lançamento do caixa?")) return;
    startTransition(async () => {
      const result = await deleteStudioCashMovement(id);
      if (result.ok) {
        toast.success("Lançamento removido.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="border-brand-yellow/25 bg-brand-yellow/[0.04] p-5">
      <div className="mb-4 flex items-start gap-2">
        <Building2 className="mt-0.5 size-5 text-brand-yellow" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Lançamentos do estúdio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gastos do dia a dia (cartão, assinaturas, operacional) sem precisar de
            projeto. Opcional: vincule a um job para análise de margem.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 rounded-xl border border-border/80 bg-background/40 p-4 md:grid-cols-2 lg:grid-cols-6 lg:items-end"
      >
        <div className="space-y-2 lg:col-span-1">
          <Label>Tipo</Label>
          <Controller
            control={control}
            name="movement_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="in">Entrada</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="studio-desc">Descrição</Label>
          <Input
            id="studio-desc"
            placeholder="Ex.: Fatura cartão · Adobe · Aluguel cowork"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="studio-amount">Valor (R$)</Label>
          <Input id="studio-amount" placeholder="150,00" {...register("amount")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="studio-date">Data</Label>
          <Input id="studio-date" type="date" {...register("occurred_at")} />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(studioCashCategoryLabels).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label>Projeto (opcional)</Label>
          <Controller
            control={control}
            name="project_id"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem projeto — só estúdio</SelectItem>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="lg:col-span-2 lg:w-auto"
        >
          <Plus className="size-4" />
          {pending ? "Salvando…" : "Lançar no caixa"}
        </Button>
      </form>

      {movements.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {movements.slice(0, 12).map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(m.occurred_at)} ·{" "}
                  {studioCashCategoryLabels[m.category]}
                  {m.project_id ? " · vinculado a projeto" : " · estúdio"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-mono text-sm font-semibold",
                    m.movement_type === "in"
                      ? "text-success"
                      : "text-destructive",
                  )}
                >
                  {m.movement_type === "in" ? "+" : "−"}
                  {formatCurrency(Number(m.amount))}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
