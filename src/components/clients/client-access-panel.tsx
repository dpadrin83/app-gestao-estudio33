"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClientAccessSchema,
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
import { clientAccessKindLabels, formatDate } from "@/lib/format";
import type { ClientAccess } from "@/types/database";
import { cn } from "@/lib/utils";

const kinds = Object.entries(clientAccessKindLabels) as [
  ClientAccessFormValues["kind"],
  string,
][];

const emptyForm: ClientAccessFormValues = {
  kind: "instagram",
  label: "",
  login_url: "",
  username: "",
  next_due_date: "",
  password: "",
  notes: "",
  is_active: true,
};

function accessToForm(a: ClientAccess): ClientAccessFormValues {
  return {
    kind: a.kind,
    label: a.label,
    login_url: a.login_url ?? "",
    username: a.username ?? "",
    next_due_date: a.next_due_date?.slice(0, 10) ?? "",
    password: a.password ?? "",
    notes: a.notes ?? "",
    is_active: a.is_active,
  };
}

const kindPlaceholders: Record<ClientAccessFormValues["kind"], string> = {
  instagram: "Ex.: @marcaoficial · conta principal",
  registro_br: "Ex.: dominio.com.br",
  other: "Ex.: Meta Business · Google Ads",
};

const urlPlaceholders: Record<ClientAccessFormValues["kind"], string> = {
  instagram: "https://www.instagram.com/…",
  registro_br: "https://registro.br/…",
  other: "https://…",
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

function PasswordCell({ value }: { value: string | null }) {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="max-w-[120px] truncate font-mono text-xs">
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
    if (!confirm("Excluir este acesso do cliente?")) return;
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
          Instagram, Registro.br e outros — login, senha, vencimento e link do
          painel.
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
                <Label>Identificação *</Label>
                <Input
                  placeholder={kindPlaceholders[kind]}
                  {...register("label")}
                />
                {errors.label && (
                  <p className="text-xs text-destructive">{errors.label.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Usuário / e-mail</Label>
                <Input
                  placeholder="login@email.com ou @usuario"
                  {...register("username")}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha do painel"
                    autoComplete="off"
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
              <div className="space-y-2">
                <Label>Data de vencimento</Label>
                <Input type="date" {...register("next_due_date")} />
                {errors.next_due_date && (
                  <p className="text-xs text-destructive">
                    {errors.next_due_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>URL do painel</Label>
                <Input
                  placeholder={urlPlaceholders[kind]}
                  {...register("login_url")}
                />
                {errors.login_url && (
                  <p className="text-xs text-destructive">
                    {errors.login_url.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Observações</Label>
                <Input
                  placeholder="2FA no celular do cliente · quem renova…"
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
                <TableHead>Usuário</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead>Vencimento</TableHead>
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
                  <TableCell className="text-muted-foreground">
                    {a.username ?? "—"}
                  </TableCell>
                  <TableCell>
                    <PasswordCell value={a.password} />
                  </TableCell>
                  <TableCell>
                    {a.next_due_date ? formatDate(a.next_due_date) : "—"}
                  </TableCell>
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
