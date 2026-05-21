"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectCostSchema,
  type ProjectCostFormValues,
} from "@/lib/schemas/project-cost";
import { createProjectCost, deleteProjectCost } from "@/lib/actions/finance";
import { ProjectFinanceDocuments } from "@/components/projects/project-finance-documents";
import { PaymentStatusBadge } from "@/components/finance/payment-status-badge";
import { MarginBadge } from "@/components/finance/margin-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDuration,
} from "@/lib/format";
import type {
  PaymentStatus,
  ProjectCost,
  ProjectFinanceDocument,
} from "@/types/database";
import type { ProjectFinanceSummary } from "@/lib/actions/finance";

export function ProjectFinance({
  projectId,
  costs,
  summary,
  paymentStatus,
  invoicedAt,
  receivedAt,
  marginAlertPercent,
  documents,
}: {
  projectId: string;
  costs: ProjectCost[];
  summary: ProjectFinanceSummary;
  paymentStatus: PaymentStatus;
  invoicedAt: string | null;
  receivedAt: string | null;
  marginAlertPercent: number;
  documents: ProjectFinanceDocument[];
}) {
  const marginPercent =
    summary.budget > 0
      ? Math.round((summary.margin / summary.budget) * 100)
      : null;
  const marginAtRisk =
    marginPercent != null && marginPercent < marginAlertPercent;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectCostFormValues>({
    resolver: zodResolver(ProjectCostSchema),
    defaultValues: { description: "", amount: "", incurred_at: today },
  });

  function onSubmit(values: ProjectCostFormValues) {
    startTransition(async () => {
      const result = await createProjectCost(projectId, values);
      if (result.ok) {
        toast.success("Custo lançado.");
        reset({ description: "", amount: "", incurred_at: today });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(costId: string) {
    startTransition(async () => {
      const result = await deleteProjectCost(costId, projectId);
      if (result.ok) {
        toast.success("Custo removido.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4 p-4">
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Pagamento
          </p>
          <div className="mt-1">
            <PaymentStatusBadge status={paymentStatus} />
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Faturado
          </p>
          <p className="mt-1 text-sm">
            {invoicedAt ? formatDateShort(invoicedAt) : "—"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Recebido
          </p>
          <p className="mt-1 text-sm">
            {receivedAt ? formatDateShort(receivedAt) : "—"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Margem %
          </p>
          <div className="mt-1">
            <MarginBadge percent={marginPercent} atRisk={marginAtRisk} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Edite status e datas em Dados do projeto.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Orçamento</p>
          <p className="mt-1 font-mono text-xl font-bold">{formatCurrency(summary.budget)}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Custos</p>
          <p className="mt-1 font-mono text-xl font-bold">{formatCurrency(summary.costsTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Mão de obra ({formatDuration(summary.hoursMs)} × {formatCurrency(summary.hourlyRate)}/h)
          </p>
          <p className="mt-1 font-mono text-xl font-bold">{formatCurrency(summary.laborCost)}</p>
        </Card>
        <Card className="p-4 border-brand-purple/30">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Margem</p>
          <p
            className={`mt-1 font-mono text-xl font-bold ${
              summary.margin < 0 ? "text-destructive" : "text-success"
            }`}
          >
            {formatCurrency(summary.margin)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Lançar custo</h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 sm:grid-cols-3 sm:items-end"
        >
          <div className="sm:col-span-1">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} />
          </div>
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" {...register("amount")} placeholder="1500" />
          </div>
          <div>
            <Label htmlFor="incurred_at">Data</Label>
            <Input id="incurred_at" type="date" {...register("incurred_at")} />
          </div>
          <Button type="submit" disabled={pending} className="sm:col-span-3 sm:w-auto">
            Adicionar
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nenhum custo lançado.
                </TableCell>
              </TableRow>
            ) : (
              costs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.description}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatDate(c.incurred_at)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(Number(c.amount))}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => remove(c.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ProjectFinanceDocuments projectId={projectId} documents={documents} />
    </div>
  );
}
