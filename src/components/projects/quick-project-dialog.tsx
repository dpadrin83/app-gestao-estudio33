"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap } from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  QuickProjectSchema,
  type QuickProjectFormValues,
} from "@/lib/schemas/quick-project";
import { createProjectQuick } from "@/lib/actions/projects";
import { serviceLineLabels } from "@/lib/format";
import { INTERNAL_PROJECTS_CLIENT_NAME } from "@/lib/projects/internal-client";

const serviceLines = Object.entries(serviceLineLabels) as [
  QuickProjectFormValues["service_line"],
  string,
][];

const defaults: QuickProjectFormValues = {
  name: "",
  service_line: "web_dev",
  setup_digital_schedule: true,
};

type QuickProjectDialogProps = {
  triggerClassName?: string;
  triggerLabel?: React.ReactNode;
};

export function QuickProjectDialog({
  triggerClassName,
  triggerLabel,
}: QuickProjectDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<QuickProjectFormValues>({
    resolver: zodResolver(QuickProjectSchema),
    defaultValues: defaults,
  });

  function onSubmit(values: QuickProjectFormValues) {
    startTransition(async () => {
      const result = await createProjectQuick(values);
      if (result.ok && result.data?.id) {
        const steps = result.data.scheduleSteps;
        if (result.data.warning) {
          toast.warning(result.data.warning);
        }
        toast.success(
          steps != null
            ? `Projeto criado com ${steps} etapas no cronograma.`
            : "Projeto criado — marque as etapas no cronograma.",
        );
        setOpen(false);
        reset(defaults);
        router.push(`/projects/${result.data.id}#cronograma`);
        router.refresh();
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset(defaults);
      }}
    >
      <DialogTrigger
        render={
          triggerClassName ? (
            <button type="button" className={triggerClassName}>
              {triggerLabel}
            </button>
          ) : (
            <Button type="button" variant="outline" size="sm">
              <Zap className="size-4" />
              Lançar rápido
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar projeto rápido</DialogTitle>
          <DialogDescription>
            Para apps e sistemas já em andamento. Usa o cliente{" "}
            <strong className="text-foreground">{INTERNAL_PROJECTS_CLIENT_NAME}</strong>
            {" "}— você vincula o cliente real depois em Dados do projeto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-name">Nome do projeto *</Label>
            <Input
              id="quick-name"
              placeholder="Ex.: Hub Gestão E33, App pessoal…"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Área (opcional)</Label>
            <Controller
              control={control}
              name="service_line"
              render={({ field }) => (
                <Select
                  value={field.value ?? "web_dev"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceLines.map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3">
            <Controller
              control={control}
              name="setup_digital_schedule"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value ?? true}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-1 rounded border-border"
                />
              )}
            />
            <span className="text-sm text-muted-foreground">
              Importar <strong className="text-foreground">Soluções Digitais</strong>{" "}
              e publicar no cronograma (marque no Gantt o que já foi feito).
            </span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Lançar projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
