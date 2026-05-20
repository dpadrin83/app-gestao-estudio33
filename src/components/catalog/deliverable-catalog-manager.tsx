"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, GitBranch, FolderOpen } from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DeliverableCatalogGroupSchema,
  DeliverableCatalogItemSchema,
  type DeliverableCatalogGroupFormValues,
  type DeliverableCatalogItemFormValues,
} from "@/lib/schemas/deliverable-catalog";
import {
  createCatalogGroup,
  deleteCatalogGroup,
  createDeliverableCatalogItem,
  updateDeliverableCatalogItem,
  deleteDeliverableCatalogItem,
} from "@/lib/actions/deliverable-catalog";
import { deliverableTypeLabels } from "@/lib/format";
import type {
  DeliverableCatalogGroupWithItems,
  DeliverableCatalogItem,
  StudioProfessional,
} from "@/types/database";
import { cn } from "@/lib/utils";

const types = Object.entries(deliverableTypeLabels) as [
  DeliverableCatalogItemFormValues["deliverable_type"],
  string,
][];

function itemToForm(
  item: DeliverableCatalogItem,
  groupId: string,
): DeliverableCatalogItemFormValues {
  return {
    group_id: groupId,
    name: item.name,
    deliverable_type: item.deliverable_type,
    estimated_days: item.estimated_days,
    professional_id: item.professional_id ?? "",
    predecessor_id: item.predecessor_id ?? "",
    service_line: item.service_line ?? "",
    notes: item.notes ?? "",
    is_active: item.is_active,
  };
}

export function DeliverableCatalogManager({
  groups: initialGroups,
  ungrouped,
  professionals,
}: {
  groups: DeliverableCatalogGroupWithItems[];
  ungrouped: DeliverableCatalogItem[];
  professionals: StudioProfessional[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialGroups[0]?.id ?? null,
  );
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const selectedGroup = initialGroups.find((g) => g.id === selectedGroupId);
  const areaItems = selectedGroup?.items ?? [];

  const areaForm = useForm<DeliverableCatalogGroupFormValues>({
    resolver: zodResolver(DeliverableCatalogGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const itemForm = useForm<DeliverableCatalogItemFormValues>({
    resolver: zodResolver(DeliverableCatalogItemSchema),
    defaultValues: {
      group_id: selectedGroupId ?? "",
      name: "",
      deliverable_type: "doc",
      estimated_days: 2,
      professional_id: "",
      predecessor_id: "",
      service_line: "",
      notes: "",
      is_active: true,
    },
  });

  function openNewItem() {
    if (!selectedGroupId) {
      toast.error("Crie ou selecione uma área primeiro.");
      return;
    }
    setEditingItemId(null);
    itemForm.reset({
      group_id: selectedGroupId,
      name: "",
      deliverable_type: "doc",
      estimated_days: 2,
      professional_id: "",
      predecessor_id: "",
      service_line: "",
      notes: "",
      is_active: true,
    });
    setItemFormOpen(true);
  }

  function startEditItem(item: DeliverableCatalogItem) {
    if (!selectedGroupId) return;
    setEditingItemId(item.id);
    itemForm.reset(itemToForm(item, selectedGroupId));
    setItemFormOpen(true);
  }

  function submitArea(values: DeliverableCatalogGroupFormValues) {
    startTransition(async () => {
      const result = await createCatalogGroup(values);
      if (result.ok) {
        toast.success(`Área "${values.name}" criada.`);
        setAreaDialogOpen(false);
        areaForm.reset({ name: "", description: "" });
        if (result.data?.id) setSelectedGroupId(result.data.id);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function submitItem(values: DeliverableCatalogItemFormValues) {
    startTransition(async () => {
      const result = editingItemId
        ? await updateDeliverableCatalogItem(editingItemId, values)
        : await createDeliverableCatalogItem(values);
      if (result.ok) {
        toast.success(editingItemId ? "Etapa atualizada." : "Etapa adicionada.");
        setItemFormOpen(false);
        setEditingItemId(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteArea(id: string, name: string) {
    if (!confirm(`Excluir a área "${name}" e todas as etapas dentro dela?`)) return;
    startTransition(async () => {
      const result = await deleteCatalogGroup(id);
      if (result.ok) {
        toast.success("Área excluída.");
        if (selectedGroupId === id) {
          setSelectedGroupId(initialGroups.find((g) => g.id !== id)?.id ?? null);
        }
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteItem(id: string) {
    if (!confirm("Excluir esta etapa?")) return;
    startTransition(async () => {
      const result = await deleteDeliverableCatalogItem(id);
      if (result.ok) {
        toast.success("Etapa excluída.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const predecessorOptions = areaItems.filter((i) => i.id !== editingItemId);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Primeiro crie uma <strong>área</strong> (ex.: Onboarding). Depois cadastre as{" "}
        <strong>etapas</strong> dentro dela e defina qual termina antes da próxima
        começar.
      </p>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Coluna: áreas */}
        <Card className="w-full shrink-0 p-4 lg:w-64">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Áreas</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                areaForm.reset({ name: "", description: "" });
                setAreaDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {initialGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhuma área. Ex.: Onboarding, Identidade, Site.
            </p>
          ) : (
            <ul className="space-y-1">
              {initialGroups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition",
                      selectedGroupId === g.id
                        ? "bg-brand-orange/15 text-foreground"
                        : "hover:bg-muted/60 text-muted-foreground",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FolderOpen className="size-3.5 shrink-0" />
                      <span className="truncate font-medium">{g.name}</span>
                    </span>
                    <span className="font-mono text-[10px]">{g.items.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Coluna: etapas da área */}
        <div className="min-w-0 flex-1 space-y-4">
          {selectedGroup ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
                  {selectedGroup.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup.description}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
                    {areaItems.length} etapa(s) · ~
                    {areaItems.reduce((s, i) => s + i.estimated_days, 0)} dias
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={openNewItem}>
                    <Plus className="size-4" />
                    Etapa nesta área
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() =>
                      handleDeleteArea(selectedGroup.id, selectedGroup.name)
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {itemFormOpen && (
                <Card className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    {editingItemId ? "Editar etapa" : "Nova etapa"}
                  </h3>
                  <form
                    onSubmit={itemForm.handleSubmit(submitItem)}
                    className="space-y-4"
                  >
                    <input type="hidden" {...itemForm.register("group_id")} />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Nome da etapa *</Label>
                        <Input
                          placeholder="Ex.: Cadastrar cliente no sistema"
                          {...itemForm.register("name")}
                        />
                        {itemForm.formState.errors.name && (
                          <p className="text-xs text-destructive">
                            {itemForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Controller
                          control={itemForm.control}
                          name="deliverable_type"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {types.map(([v, label]) => (
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
                        <Label>Duração (dias) *</Label>
                        <Input
                          type="number"
                          min={1}
                          {...itemForm.register("estimated_days", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Inicia após</Label>
                        <Controller
                          control={itemForm.control}
                          name="predecessor_id"
                          render={({ field }) => (
                            <Select
                              value={field.value || "__none__"}
                              onValueChange={(v) =>
                                field.onChange(v === "__none__" ? "" : v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Primeira da área" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">
                                  Nenhuma — primeira etapa da área
                                </SelectItem>
                                {predecessorOptions.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Profissional</Label>
                        <Controller
                          control={itemForm.control}
                          name="professional_id"
                          render={({ field }) => (
                            <Select
                              value={field.value || "__none__"}
                              onValueChange={(v) =>
                                field.onChange(v === "__none__" ? "" : v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Opcional" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">—</SelectItem>
                                {professionals.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={pending}>
                        {editingItemId ? "Salvar" : "Adicionar"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setItemFormOpen(false);
                          setEditingItemId(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {areaItems.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma etapa em {selectedGroup.name}. Ex.: cadastrar cliente,
                  enviar proposta, criar briefing…
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Depende de</TableHead>
                        <TableHead className="w-[72px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areaItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.estimated_days}d
                          </TableCell>
                          <TableCell>
                            {item.predecessor ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <GitBranch className="size-3" />
                                {item.predecessor.name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Início
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => startEditItem(item)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => handleDeleteItem(item.id)}
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
            </>
          ) : (
            <Card className="p-10 text-center text-muted-foreground">
              Selecione uma área ou crie <strong>Onboarding</strong> para começar.
            </Card>
          )}
        </div>
      </div>

      {ungrouped.length > 0 && (
        <p className="text-xs text-amber-600">
          {ungrouped.length} etapa(s) antigas sem área — recadastre dentro de uma área.
        </p>
      )}

      <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova área</DialogTitle>
          </DialogHeader>
          <form onSubmit={areaForm.handleSubmit(submitArea)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da área *</Label>
              <Input
                placeholder="Ex.: Onboarding"
                {...areaForm.register("name")}
              />
              {areaForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {areaForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Etapas antes do projeto começar de fato"
                {...areaForm.register("description")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAreaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Criar área
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
