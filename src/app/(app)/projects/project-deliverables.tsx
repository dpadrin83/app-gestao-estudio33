"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DeliverableSchema,
  type DeliverableFormValues,
} from "@/lib/schemas/deliverable";
import {
  createDeliverable,
  updateDeliverableStatus,
  updateDeliverableActivity,
  deleteDeliverable,
  addDeliverableVersion,
} from "@/lib/actions/deliverables";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliverableStatusBadge } from "@/components/deliverable-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Send, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { deliverableTypeLabels, formatDateTime } from "@/lib/format";
import type {
  Activity,
  DeliverableWithVersions,
  DeliverableStatus,
} from "@/types/database";

const types = Object.entries(deliverableTypeLabels) as [
  DeliverableFormValues["type"],
  string,
][];

export function ProjectDeliverables({
  projectId,
  deliverables: initial,
  activities,
}: {
  projectId: string;
  deliverables: DeliverableWithVersions[];
  activities: Activity[];
}) {
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState<DeliverableWithVersions | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DeliverableFormValues>({
    resolver: zodResolver(DeliverableSchema),
    defaultValues: {
      name: "",
      type: "link",
      external_link: "",
      notes: "",
      activity_id: "",
    },
  });

  function onSubmit(values: DeliverableFormValues) {
    startTransition(async () => {
      const result = versionTarget
        ? await addDeliverableVersion(versionTarget.id, projectId, values)
        : await createDeliverable(projectId, values);
      if (result.ok) {
        toast.success(versionTarget ? "Nova versão adicionada." : "Entregável criado.");
        setOpen(false);
        setVersionTarget(null);
        reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function setStatus(id: string, status: DeliverableStatus) {
    startTransition(async () => {
      const result = await updateDeliverableStatus(id, projectId, status);
      if (result.ok) {
        toast.success(
          status === "sent_to_client"
            ? "Enviado ao cliente — aparece no portal."
            : "Status atualizado.",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function linkActivity(deliverableId: string, activityId: string) {
    startTransition(async () => {
      const result = await updateDeliverableActivity(
        deliverableId,
        projectId,
        activityId === "" ? null : activityId,
      );
      if (result.ok) {
        toast.success("Vínculo com o cronograma atualizado.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir este entregável?")) return;
    startTransition(async () => {
      const result = await deleteDeliverable(id, projectId);
      if (result.ok) {
        toast.success("Excluído.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setVersionTarget(null);
            reset();
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Novo entregável
        </Button>
      </div>

      {initial.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum entregável ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {initial.map((d) => {
            const latest = d.versions[0];
            const linked = d.activity_id
              ? activityById.get(d.activity_id)
              : null;
            return (
              <Card key={d.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">
                      {deliverableTypeLabels[d.type]}
                      {latest && ` · v${latest.version_number}`}
                      {linked && ` · ${linked.name}`}
                    </p>
                    {latest?.external_link && (
                      <a
                        href={latest.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-brand-orange hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        Abrir arquivo
                      </a>
                    )}
                  </div>
                  <DeliverableStatusBadge status={d.status} />
                </div>
                {activities.length > 0 && (
                  <div className="mt-3 max-w-md">
                    <Label className="text-xs text-muted-foreground">
                      Atividade do cronograma
                    </Label>
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm"
                      value={d.activity_id ?? ""}
                      disabled={pending}
                      onChange={(e) => linkActivity(d.id, e.target.value)}
                    >
                      <option value="">Sem vínculo</option>
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setStatus(d.id, "sent_to_client")}
                    >
                      <Send className="size-3.5" />
                      Enviar ao cliente
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setVersionTarget(d);
                      reset({
                        name: d.name,
                        type: d.type,
                        external_link: "",
                        notes: "",
                      });
                      setOpen(true);
                    }}
                  >
                    Nova versão
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => remove(d.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {d.comments.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {d.comments.map((c) => (
                      <li key={c.id} className="text-xs text-muted-foreground">
                        <span className="font-mono uppercase text-[10px]">
                          {c.author_role === "client" ? "cliente" : "você"} ·{" "}
                          {formatDateTime(c.created_at)}
                        </span>
                        <p className="text-foreground">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {versionTarget ? "Nova versão" : "Novo entregável"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!versionTarget && (
              <>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    {...register("type")}
                    className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    {types.map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {activities.length > 0 && (
                  <div>
                    <Label>Atividade do cronograma</Label>
                    <Controller
                      control={control}
                      name="activity_id"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v ?? "")}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Opcional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {activities.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
              </>
            )}
            <div>
              <Label htmlFor="external_link">Link (Drive, Figma, etc.)</Label>
              <Input
                id="external_link"
                placeholder="https://"
                {...register("external_link")}
              />
              {errors.external_link && (
                <p className="text-xs text-destructive">
                  {errors.external_link.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input id="notes" {...register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
