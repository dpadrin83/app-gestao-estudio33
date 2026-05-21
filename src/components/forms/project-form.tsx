"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema, type ProjectFormValues } from "@/lib/schemas/project";
import { createProject, updateProject } from "@/lib/actions/projects";
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
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  projectStatusLabels,
  paymentStatusLabels,
  serviceLineLabels,
} from "@/lib/format";
import type { Project } from "@/types/database";

type ClientOption = { id: string; name: string };

export function ProjectForm({
  initial,
  clientOptions,
}: {
  initial?: Project;
  clientOptions: ClientOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: initial
      ? {
          client_id: initial.client_id,
          name: initial.name,
          description: initial.description ?? "",
          briefing_notes: initial.briefing_notes ?? "",
          status: initial.status,
          start_date: initial.start_date ?? "",
          expected_end_date: initial.expected_end_date ?? "",
          contract_value:
            initial.contract_value != null ? String(initial.contract_value) : "",
          payment_status: initial.payment_status,
          service_line: initial.service_line ?? "",
        }
      : {
          client_id: "",
          name: "",
          description: "",
          briefing_notes: "",
          status: "in_progress",
          start_date: "",
          expected_end_date: "",
          contract_value: "",
          payment_status: "to_invoice",
          service_line: "",
        },
  });

  function onSubmit(values: ProjectFormValues) {
    startTransition(async () => {
      if (initial) {
        const result = await updateProject(initial.id, values);
        if (result.ok) {
          toast.success("Projeto atualizado.");
          router.push("/projects");
          router.refresh();
        } else {
          toast.error(result.error);
        }
        return;
      }

      const result = await createProject(values);
      if (result.ok) {
        toast.success("Projeto criado.");
        router.push(`/projects/${result.data!.id}#plano-entregaveis`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente *</Label>
          <Controller
            control={control}
            name="client_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Selecione um cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Nenhum cliente ativo. Cadastre primeiro.
                    </div>
                  ) : (
                    clientOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.client_id && (
            <p className="text-xs text-destructive">{errors.client_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome do projeto *</Label>
        <Input
          id="name"
          placeholder="Ex.: Identidade visual completa"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Área E33</Label>
        <Controller
          control={control}
          name="service_line"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a linha de serviço…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não definida</SelectItem>
                {Object.entries(serviceLineLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Alinha o projeto ao template de cronograma e plano de entregas.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          rows={5}
          placeholder="Escopo, observações, links de referência…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="briefing_notes">Briefing</Label>
        <textarea
          id="briefing_notes"
          rows={6}
          placeholder="Texto do briefing, objetivos, público, referências, restrições…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          {...register("briefing_notes")}
        />
        <p className="text-xs text-muted-foreground">
          Fica salvo no projeto. Quando configurar a IA depois, ela usa este texto como contexto.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Controller
            control={control}
            name="payment_status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="start_date">Início</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
          {errors.start_date && (
            <p className="text-xs text-destructive">{errors.start_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected_end_date">Término previsto</Label>
          <Input
            id="expected_end_date"
            type="date"
            {...register("expected_end_date")}
          />
          {errors.expected_end_date && (
            <p className="text-xs text-destructive">
              {errors.expected_end_date.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract_value">Valor do contrato (R$)</Label>
          <Input
            id="contract_value"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register("contract_value")}
          />
          {errors.contract_value && (
            <p className="text-xs text-destructive">{errors.contract_value.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Salvando…" : initial ? "Salvar alterações" : "Criar projeto"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/projects")}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
