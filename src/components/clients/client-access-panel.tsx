"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClientAccessSchema,
  isRenewalAccessKind,
  type ClientAccessFormValues,
} from "@/lib/schemas/client-access";
import {
  createClientAccess,
  updateClientAccess,
  deleteClientAccess,
} from "@/lib/actions/client-access";
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
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  clientAccessBillingCycleLabels,
  clientAccessKindLabels,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import type { ClientAccess, ClientAccessKind } from "@/types/database";
import { cn } from "@/lib/utils";

const kindOrder: ClientAccessKind[] = [
  "instagram",
  "registro_br",
  "domain_br",
  "domain",
  "hosting",
  "email",
  "ssl",
  "cdn",
  "other",
];

const cycles = Object.entries(clientAccessBillingCycleLabels) as [
  NonNullable<ClientAccessFormValues["billing_cycle"]>,
  string,
][];

const emptyForm: ClientAccessFormValues = {
  kind: "instagram",
  label: "",
  username: "",
  password: "",
  login_url: "",
  next_due_date: "",
  provider: "",
  billing_cycle: "yearly",
  amount: "",
  notes: "",
  is_active: true,
};

function accessToForm(a: ClientAccess): ClientAccessFormValues {
  return {
    kind: a.kind,
    label: a.label,
    username: a.username,
    password: a.password,
    login_url: a.login_url ?? "",
    next_due_date: a.next_due_date?.slice(0, 10) ?? "",
    provider: a.provider ?? "",
    billing_cycle: a.billing_cycle ?? "yearly",
    amount: a.amount != null ? String(a.amount).replace(".", ",") : "",
    notes: a.notes ?? "",
    is_active: a.is_active,
  };
}

const labelPlaceholders: Partial<Record<ClientAccessKind, string>> = {
  instagram: "Ex.: @marcaoficial",
  registro_br: "Ex.: dominio.com.br",
  domain_br: "Ex.: panorama.com.br",
  hosting: "Ex.: Hospedagem principal",
};

function DueBadge({
  dueDate,
  isActive,
}: {
  dueDate: string | null;
  isActive: boolean;
}) {
  if (!dueDate) return <span className="text-muted-foreground">—</span>;
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

function PasswordCell({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="max-w-[100px] truncate font-mono text-xs">
        {visible ? value : "••••••••"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={() => setVisible((v) => !v)}
        title={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </Button>
    </div>
  );
}

export function ClientAccessPanel({
  clientId,
  access: initial,
}: {
  clientId: string;
  access: ClientAccess[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClientAccessFormValues>({
    resolver: zodResolver(ClientAccessSchema),
    defaultValues: emptyForm,
  });

  const kind = watch("kind");
  const renewal = isRenewalAccessKind(kind);

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setShowPassword(false);
    reset(emptyForm);
  }

  function startEdit(a: ClientAccess) {
    setEditingId(a.id);
    setOpen(true);
    setShowPassword(false);
    reset(accessToForm(a));
  }

  function onSubmit(values: ClientAccessFormValues) {
    startTransition(async () => {
      const result = editingId
        ? await updateClientAccess(editingId, clientId, values)
        : await createClientAccess(clientId, values);
      if (result.ok) {
        toast.success(editingId ? "Acesso atualizado." : "Acesso cadastrado.");
        closeForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este acesso?")) return;
    startTransition(async () => {
      const result = await deleteClientAccess(id, clientId);
      if (result.ok) {
        toast.success("Acesso excluído.");
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
          Instagram, Registro.br, domínios, hospedagem e outros — login e senha
          obrigatórios; vencimento e valor para renovações.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (open && !editingId) closeForm();
            else {
              setEditingId(null);
              setShowPassword(false);
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
            {editingId ? "Editar acesso" : "Novo acesso"}
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
                        {kindOrder.map((v) => (
                          <SelectItem key={v} value={v}>
                            {clientAccessKindLabels[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Identificação *</Label>
                <Input
                  placeholder={
                    labelPlaceholders[kind] ?? "Nome do acesso ou serviço"
                  }
                  {...register("label")}
                />
                {errors.label && (
                  <p className="text-xs text-destructive">{errors.label.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Login *</Label>
                <Input
                  placeholder="usuário ou e-mail"
                  autoComplete="off"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha do painel"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 size-9"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                </div>
                {editingId && (
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para manter a senha atual.
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>URL do painel</Label>
                <Input
                  placeholder="https://…"
                  {...register("login_url")}
                />
                {errors.login_url && (
                  <p className="text-xs text-destructive">
                    {errors.login_url.message}
                  </p>
                )}
              </div>

              {renewal && (
                <>
                  <div className="space-y-2">
                    <Label>Provedor</Label>
                    <Input
                      placeholder="Registro.br, Hostinger…"
                      {...register("provider")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de vencimento *</Label>
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
                        <Select
                          value={field.value ?? "yearly"}
                          onValueChange={field.onChange}
                        >
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
                      <p className="text-xs text-destructive">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {!renewal && (
                <div className="space-y-2">
                  <Label>Data de vencimento</Label>
                  <Input type="date" {...register("next_due_date")} />
                  {errors.next_due_date && (
                    <p className="text-xs text-destructive">
                      {errors.next_due_date.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 sm:col-span-3">
                <Label>Observações</Label>
                <Input
                  placeholder="2FA, quem renova, vault…"
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
          Nenhum acesso cadastrado para este cliente.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Identificação</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.map((a) => (
                <TableRow
                  key={a.id}
                  className={cn(!a.is_active && "opacity-50")}
                >
                  <TableCell className="font-mono text-[10px] uppercase text-muted-foreground">
                    {clientAccessKindLabels[a.kind]}
                  </TableCell>
                  <TableCell className="font-medium">{a.label}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-muted-foreground">
                    {a.username}
                  </TableCell>
                  <TableCell>
                    <PasswordCell value={a.password} />
                  </TableCell>
                  <TableCell>
                    {a.next_due_date ? formatDate(a.next_due_date) : "—"}
                  </TableCell>
                  <TableCell>{formatCurrency(a.amount)}</TableCell>
                  <TableCell>
                    <DueBadge
                      dueDate={a.next_due_date}
                      isActive={a.is_active}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      {a.login_url && (
                        <a
                          href={a.login_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Abrir painel"
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
                        onClick={() => startEdit(a)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={pending}
                        onClick={() => handleDelete(a.id)}
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
