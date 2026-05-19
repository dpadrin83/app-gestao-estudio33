"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClientServiceSchema,
  type ClientServiceFormValues,
} from "@/lib/schemas/client-service";
import {
  createClientService,
  updateClientService,
  deleteClientService,
} from "@/lib/actions/client-services";
import {
  getServiceDueStatus,
  serviceDueLabel,
} from "@/lib/client-services/due-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  clientServiceBillingCycleLabels,
  clientServiceKindLabels,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import type { ClientService } from "@/types/database";
import { cn } from "@/lib/utils";

const kinds = Object.entries(clientServiceKindLabels) as [
  ClientServiceFormValues["kind"],
  string,
][];

const cycles = Object.entries(clientServiceBillingCycleLabels) as [
  ClientServiceFormValues["billing_cycle"],
  string,
][];

const emptyForm: ClientServiceFormValues = {
  kind: "domain_br",
  name: "",
  provider: "",
  next_due_date: "",
  billing_cycle: "yearly",
  amount: "",
  panel_url: "",
  notes: "",
  is_active: true,
};

function serviceToForm(s: ClientService): ClientServiceFormValues {
  return {
    kind: s.kind,
    name: s.name,
    provider: s.provider ?? "",
    next_due_date: s.next_due_date.slice(0, 10),
    billing_cycle: s.billing_cycle,
    amount: s.amount != null ? String(s.amount).replace(".", ",") : "",
    panel_url: s.panel_url ?? "",
    notes: s.notes ?? "",
    is_active: s.is_active,
  };
}

function DueBadge({ dueDate, isActive }: { dueDate: string; isActive: boolean }) {
  const { status, daysUntil } = getServiceDueStatus(dueDate, isActive);
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        status === "overdue" &&
          "border-destructive/40 bg-destructive/10 text-destructive",
        status === "soon" &&
          "border-brand-yellow/40 bg-brand-yellow/10 text-[#FDBA74]",
        status === "ok" && "border-success/30 bg-success/10 text-success",
        status === "inactive" && "border-border text-muted-foreground",
      )}
    >
      {serviceDueLabel(daysUntil, status)}
    </span>
  );
}

export function ClientServicesPanel({
  clientId,
  services: initial,
}: {
  clientId: string;
  services: ClientService[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClientServiceFormValues>({
    resolver: zodResolver(ClientServiceSchema),
    defaultValues: emptyForm,
  });

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    reset(emptyForm);
  }

  function startEdit(s: ClientService) {
    setEditingId(s.id);
    setOpen(true);
    reset(serviceToForm(s));
  }

  function onSubmit(values: ClientServiceFormValues) {
    startTransition(async () => {
      const result = editingId
        ? await updateClientService(editingId, clientId, values)
        : await createClientService(clientId, values);
      if (result.ok) {
        toast.success(editingId ? "Serviço atualizado." : "Serviço cadastrado.");
        closeForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este registro de domínio/hospedagem?")) return;
    startTransition(async () => {
      const result = await deleteClientService(id, clientId);
      if (result.ok) {
        toast.success("Registro excluído.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Domínios (.br), hospedagem, e-mail e renovações — com vencimento e valor.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (open && !editingId) closeForm();
            else {
              setEditingId(null);
              reset(emptyForm);
              setOpen(true);
            }
          }}
        >
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>

      {open && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {editingId ? "Editar serviço" : "Novo domínio / hospedagem"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Controller
                  control={control}
                  name="kind"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {kinds.map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome / domínio *</Label>
                <Input
                  placeholder="Ex.: panorama.com.br"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Input
                  placeholder="Registro.br, Hostinger…"
                  {...register("provider")}
                />
              </div>
              <div className="space-y-2">
                <Label>Próximo vencimento *</Label>
                <Input type="date" {...register("next_due_date")} />
                {errors.next_due_date && (
                  <p className="text-xs text-destructive">
                    {errors.next_due_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ciclo</Label>
                <Controller
                  control={control}
                  name="billing_cycle"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cycles.map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input placeholder="89,90" {...register("amount")} />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Painel (URL)</Label>
                <Input
                  placeholder="https://registro.br/…"
                  {...register("panel_url")}
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Observações</Label>
                <Input
                  placeholder="Login no 1Password, plano anual…"
                  {...register("notes")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {editingId ? "Salvar" : "Cadastrar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {initial.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum domínio ou hospedagem cadastrado para este cliente.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-[10px] uppercase text-muted-foreground">
                    {clientServiceKindLabels[s.kind]}
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.provider ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="block">{formatDate(s.next_due_date)}</span>
                    <span className="text-xs text-muted-foreground">
                      {clientServiceBillingCycleLabels[s.billing_cycle]}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(s.amount)}</TableCell>
                  <TableCell>
                    <DueBadge dueDate={s.next_due_date} isActive={s.is_active} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      {s.panel_url && (
                        <a
                          href={s.panel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={pending}
                        onClick={() => startEdit(s)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={pending}
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
