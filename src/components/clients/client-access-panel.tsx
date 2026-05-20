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
import { clientAccessKindLabels } from "@/lib/format";
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
  notes: "",
  is_active: true,
};

function accessToForm(a: ClientAccess): ClientAccessFormValues {
  return {
    kind: a.kind,
    label: a.label,
    login_url: a.login_url ?? "",
    username: a.username ?? "",
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
    reset(emptyForm);
  }

  function startEdit(a: ClientAccess) {
    setEditingId(a.id);
    setOpen(true);
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
          Instagram, Registro.br e outros painéis — login, URL e onde guardar a
          senha (ex.: 1Password). Não cole senha em texto aqui.
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
                  placeholder="Vault 1Password · item X · quem tem 2FA…"
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
                <TableHead>Observações</TableHead>
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
                  <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                    {a.notes ?? "—"}
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
