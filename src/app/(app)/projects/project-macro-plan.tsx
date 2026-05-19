"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliverableStatusBadge } from "@/components/deliverable-status-badge";
import {
  MacroAreaSchema,
  WorkItemSchema,
  type MacroAreaFormValues,
  type WorkItemFormValues,
} from "@/lib/schemas/project-macro-plan";
import {
  createMacroArea,
  createWorkItem,
  deleteMacroArea,
  deleteWorkItem,
  updateWorkItemDays,
} from "@/lib/actions/project-macro-plan";
import { workItemTypeLabels } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ProjectMacroPlan,
  StudioProfessional,
  ProjectWorkItemType,
} from "@/types/database";

type FormMode = "macro" | "sub_etapa" | "entregavel" | null;

export function ProjectMacroPlan({
  projectId,
  plan,
  professionals,
}: {
  projectId: string;
  plan: ProjectMacroPlan;
  professionals: StudioProfessional[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(
    plan.areas[0]?.id ?? null,
  );
  const [formMode, setFormMode] = useState<FormMode>(null);

  const selectedMacro = plan.areas.find((a) => a.id === selectedMacroId);

  const macroForm = useForm<MacroAreaFormValues>({
    resolver: zodResolver(MacroAreaSchema),
    defaultValues: { name: "", professional_id: "" },
  });

  const itemForm = useForm<WorkItemFormValues>({
    resolver: zodResolver(WorkItemSchema),
    defaultValues: {
      name: "",
      item_type: "sub_etapa",
      professional_id: "",
      estimated_days: 1,
      macro_area_id: "",
    },
  });

  function openMacroForm() {
    macroForm.reset({ name: "", professional_id: "" });
    setFormMode("macro");
  }

  function openItemForm(type: ProjectWorkItemType) {
    const defaultProf =
      selectedMacro?.professional_id ??
      professionals[0]?.id ??
      "";
    itemForm.reset({
      name: "",
      item_type: type,
      professional_id: defaultProf,
      estimated_days: 1,
      macro_area_id: selectedMacroId ?? "",
    });
    itemForm.setValue("item_type", type);
    setFormMode(type);
  }

  function submitMacro(values: MacroAreaFormValues) {
    startTransition(async () => {
      const result = await createMacroArea(projectId, values);
      if (result.ok) {
        toast.success("Área macro criada.");
        setFormMode(null);
        if (result.data?.id) setSelectedMacroId(result.data.id);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function submitItem(values: WorkItemFormValues) {
    startTransition(async () => {
      const result = await createWorkItem(projectId, {
        ...values,
        macro_area_id:
          values.macro_area_id && values.macro_area_id !== ""
            ? values.macro_area_id
            : undefined,
      });
      if (result.ok) {
        toast.success(
          values.item_type === "entregavel"
            ? "Entregável adicionado ao plano."
            : "Sub-etapa adicionada.",
        );
        setFormMode(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onDaysBlur(itemId: string, raw: string) {
    const days = parseInt(raw, 10);
    if (!Number.isFinite(days) || days < 0) return;
    startTransition(async () => {
      const result = await updateWorkItemDays(itemId, projectId, days);
      if (!result.ok) toast.error(result.error);
      else router.refresh();
    });
  }

  function removeArea(areaId: string) {
    if (!confirm("Excluir esta área macro e desvincular os itens?")) return;
    startTransition(async () => {
      const result = await deleteMacroArea(areaId, projectId);
      if (result.ok) {
        toast.success("Área macro excluída.");
        if (selectedMacroId === areaId) setSelectedMacroId(null);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function removeItem(itemId: string) {
    if (!confirm("Excluir este item? Entregáveis vinculados também serão removidos."))
      return;
    startTransition(async () => {
      const result = await deleteWorkItem(itemId, projectId);
      if (result.ok) {
        toast.success("Item excluído.");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  const itemCount =
    plan.areas.reduce((s, a) => s + a.items.length, 0) + plan.orphanItems.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>
          Total: <strong className="font-mono text-foreground">{plan.totalDays} dias</strong>
        </span>
        <span>· {plan.areas.length} áreas macro</span>
        <span>· {itemCount} itens</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={openMacroForm}>
          <Plus className="mr-1 size-3.5" />
          Nova área macro
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selectedMacroId}
          onClick={() => openItemForm("sub_etapa")}
        >
          <Plus className="mr-1 size-3.5" />
          Sub-etapa nesta macro
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openItemForm("entregavel")}
        >
          <Plus className="mr-1 size-3.5" />
          Entregável
        </Button>
      </div>

      {!selectedMacroId && plan.areas.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selecione uma área macro (clique no título) para adicionar sub-etapas.
        </p>
      )}

      {plan.areas.length === 0 && plan.orphanItems.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <p>Nenhuma área macro neste projeto.</p>
          <p className="mt-2">
            Comece com <strong>+ Nova área macro</strong> (ex.: Redação copy) e depois
            adicione sub-etapas ou entregáveis.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {plan.areas.map((area) => {
            const subtotal = area.items.reduce((s, i) => s + i.estimated_days, 0);
            const isSelected = area.id === selectedMacroId;
            return (
              <Card
                key={area.id}
                className={cn(
                  "overflow-hidden border-border/80",
                  isSelected && "ring-2 ring-brand-purple",
                )}
              >
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-border bg-brand-orange/5 px-4 py-3 text-left"
                  onClick={() => setSelectedMacroId(area.id)}
                >
                  <div>
                    <h3 className="font-semibold text-brand-orange">{area.name}</h3>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      área macro
                      {area.professional && ` · ${area.professional.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      subtotal <strong className="text-brand-orange">{subtotal} dias</strong>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      disabled={pending}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeArea(area.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </button>
                <ul className="divide-y divide-border px-2 py-1">
                  {area.items.length === 0 ? (
                    <li className="px-2 py-3 text-xs text-muted-foreground">
                      Nenhum item — use Sub-etapa ou Entregável.
                    </li>
                  ) : (
                    area.items.map((item) => (
                      <WorkItemRow
                        key={item.id}
                        item={item}
                        pending={pending}
                        onDaysBlur={onDaysBlur}
                        onDelete={() => removeItem(item.id)}
                      />
                    ))
                  )}
                </ul>
              </Card>
            );
          })}

          {plan.orphanItems.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold">Sem área macro</h3>
              </div>
              <ul className="divide-y divide-border px-2 py-1">
                {plan.orphanItems.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    pending={pending}
                    onDaysBlur={onDaysBlur}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Entregáveis do tipo <strong>entregável</strong> aparecem também em{" "}
        <Link href="#entregaveis" className="text-brand-orange hover:underline">
          Entregáveis
        </Link>{" "}
        para envio ao cliente. Prompts de IA: use o{" "}
        <Link href="/settings/prompts" className="text-brand-orange hover:underline">
          banco de prompts
        </Link>{" "}
        (Configurações).
      </p>

      <Dialog open={formMode === "macro"} onOpenChange={(o) => !o && setFormMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova área macro</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={macroForm.handleSubmit(submitMacro)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="macro-name">Nome da área macro</Label>
              <Input
                id="macro-name"
                placeholder="Ex.: Redação copy"
                {...macroForm.register("name")}
              />
              {macroForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {macroForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Profissional padrão (opcional)</Label>
              <Controller
                control={macroForm.control}
                name="professional_id"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormMode(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Criar macro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={formMode === "sub_etapa" || formMode === "entregavel"}
        onOpenChange={(o) => !o && setFormMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "entregavel" ? "Novo entregável" : "Nova sub-etapa"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={itemForm.handleSubmit(submitItem)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>
                {formMode === "entregavel" ? "Nome do entregável" : "Nome da sub-etapa"}
              </Label>
              <Input
                placeholder={
                  formMode === "entregavel"
                    ? "Ex.: Assinatura de e-mail"
                    : "Ex.: Pesquisa"
                }
                {...itemForm.register("name")}
              />
              {itemForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {itemForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Área profissional (catálogo E33)</Label>
              <Controller
                control={itemForm.control}
                name="professional_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher…" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {itemForm.formState.errors.professional_id && (
                <p className="text-xs text-destructive">
                  {itemForm.formState.errors.professional_id.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Dias estimados</Label>
                <Input
                  type="number"
                  min={0}
                  {...itemForm.register("estimated_days", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dentro da macro (opcional)</Label>
                <Controller
                  control={itemForm.control}
                  name="macro_area_id"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {plan.areas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <input type="hidden" {...itemForm.register("item_type")} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormMode(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkItemRow({
  item,
  pending,
  onDaysBlur,
  onDelete,
}: {
  item: import("@/types/database").ProjectWorkItemWithRelations;
  pending: boolean;
  onDaysBlur: (id: string, raw: string) => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-2 py-2.5 text-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className={cn(
            "font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded",
            item.item_type === "entregavel"
              ? "bg-brand-blue/20 text-blue-300"
              : "bg-brand-orange/15 text-orange-300",
          )}
        >
          {workItemTypeLabels[item.item_type]}
        </span>
        <span className="font-medium">{item.name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {item.professional.name}
        </span>
        {item.deliverable && (
          <DeliverableStatusBadge status={item.deliverable.status} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <input
            type="number"
            min={0}
            defaultValue={item.estimated_days}
            className="w-12 rounded-md border border-border bg-background px-2 py-1 text-center text-foreground"
            disabled={pending}
            onBlur={(e) => onDaysBlur(item.id, e.target.value)}
          />
          dias
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          disabled={pending}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}
