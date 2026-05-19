"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  Pencil,
  Plus,
  Trash2,
  Files,
  Sparkles,
} from "lucide-react";
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
import {
  PromptTemplateSchema,
  type PromptTemplateFormValues,
} from "@/lib/schemas/prompt-template";
import {
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  duplicatePromptTemplate,
} from "@/lib/actions/prompt-templates";
import { PromptImportDialog } from "@/components/prompts/prompt-import-dialog";
import {
  COMMON_PROMPT_VARIABLES,
  extractPromptVariables,
} from "@/lib/prompts/variables";
import { serviceLineLabels } from "@/lib/format";
import type {
  PromptTemplateWithProfessional,
  StudioProfessional,
} from "@/types/database";

const FILTER_ALL = "__all__";

export function PromptBank({
  prompts: initial,
  professionals,
}: {
  prompts: PromptTemplateWithProfessional[];
  professionals: StudioProfessional[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filterProf, setFilterProf] = useState(FILTER_ALL);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromptTemplateWithProfessional | null>(
    null,
  );
  const [previewId, setPreviewId] = useState<string | null>(null);

  const form = useForm<PromptTemplateFormValues>({
    resolver: zodResolver(PromptTemplateSchema),
    defaultValues: emptyForm(),
  });

  const bodyWatch = form.watch("body");
  const detectedVars = useMemo(
    () => extractPromptVariables(bodyWatch ?? ""),
    [bodyWatch],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initial.filter((p) => {
      if (filterProf !== FILTER_ALL && p.professional_id !== filterProf) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.deliverable_hint?.toLowerCase().includes(q) ?? false) ||
        p.body.toLowerCase().includes(q) ||
        (p.professional?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [initial, filterProf, search]);

  const preview = filtered.find((p) => p.id === previewId) ?? filtered[0] ?? null;

  function emptyForm(): PromptTemplateFormValues {
    return {
      title: "",
      professional_id: professionals[0]?.id ?? "",
      deliverable_hint: "",
      body: "",
      is_active: true,
    };
  }

  function openCreate() {
    setEditing(null);
    form.reset(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(p: PromptTemplateWithProfessional) {
    setEditing(p);
    form.reset({
      title: p.title,
      professional_id: p.professional_id ?? "",
      deliverable_hint: p.deliverable_hint ?? "",
      body: p.body,
      is_active: p.is_active,
    });
    setDialogOpen(true);
  }

  function insertVariable(name: string) {
    const token = `[${name}]`;
    const current = form.getValues("body") ?? "";
    form.setValue("body", current + (current.endsWith(" ") || !current ? "" : " ") + token);
  }

  function onSubmit(values: PromptTemplateFormValues) {
    startTransition(async () => {
      const result = editing
        ? await updatePromptTemplate(editing.id, values)
        : await createPromptTemplate(values);
      if (result.ok) {
        toast.success(editing ? "Prompt atualizado." : "Prompt cadastrado.");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm("Excluir este prompt do banco?")) return;
    startTransition(async () => {
      const result = await deletePromptTemplate(id);
      if (result.ok) {
        toast.success("Prompt excluído.");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function onDuplicate(id: string) {
    startTransition(async () => {
      const result = await duplicatePromptTemplate(id);
      if (result.ok) {
        toast.success("Cópia criada.");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  async function copyBody(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Prompt copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card className="border-brand-purple/20 bg-brand-purple/5 p-4">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-purple" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Banco de prompts</p>
              <p className="mt-1">
                Cadastre textos reutilizáveis por profissional E33. Use{" "}
                <strong className="text-foreground">[CLIENTE]</strong>,{" "}
                <strong className="text-foreground">[ENTREGAVEL]</strong> etc.
                No projeto você <em>copia</em> o prompt para a IA — não geramos
                automaticamente no plano por área.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-3.5" />
            Novo prompt
          </Button>
          <PromptImportDialog />
          <Select
            value={filterProf}
            onValueChange={(v) => setFilterProf(v ?? FILTER_ALL)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todos os profissionais</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar título ou entregável…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhum prompt encontrado. Crie o primeiro com &quot;Novo prompt&quot;.
          </Card>
        ) : (
          <ul className="space-y-2">
            {filtered.map((p) => (
              <li key={p.id}>
                <Card
                  className={`p-4 transition ${
                    preview?.id === p.id ? "ring-2 ring-brand-purple" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setPreviewId(p.id)}
                    >
                      <p className="font-semibold">{p.title}</p>
                      {p.deliverable_hint && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Entregável: {p.deliverable_hint}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[10px] text-brand-orange">
                        {p.professional?.name ?? "Sem profissional"}
                      </p>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Copiar"
                        onClick={() => copyBody(p.body)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Duplicar"
                        disabled={pending}
                        onClick={() => onDuplicate(p.id)}
                      >
                        <Files className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Editar"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        title="Excluir"
                        disabled={pending}
                        onClick={() => onDelete(p.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 font-mono text-[10px] text-muted-foreground">
                    {p.body}
                  </p>
                  {p.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.variables.map((v) => (
                        <span
                          key={v}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                        >
                          [{v}]
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Pré-visualização
        </h3>
        {preview ? (
          <Card className="p-4">
            <p className="text-sm font-semibold">{preview.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.professional?.name}
              {preview.professional?.service_line &&
                ` · ${serviceLineLabels[preview.professional.service_line]}`}
            </p>
            <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground">
              {preview.body}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => copyBody(preview.body)}
            >
              <Copy className="mr-1 size-3.5" />
              Copiar prompt
            </Button>
          </Card>
        ) : (
          <Card className="p-6 text-center text-xs text-muted-foreground">
            Selecione um prompt na lista.
          </Card>
        )}

        <Card className="p-3">
          <p className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">
            Variáveis comuns
          </p>
          <div className="flex flex-wrap gap-1">
            {COMMON_PROMPT_VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                className="rounded bg-secondary px-2 py-1 font-mono text-[10px] hover:bg-secondary/80"
                onClick={() => insertVariable(v)}
                disabled={!dialogOpen}
                title={dialogOpen ? "Inserir no formulário" : "Abra Novo prompt para inserir"}
              >
                [{v}]
              </button>
            ))}
          </div>
        </Card>
      </aside>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar prompt" : "Cadastrar prompt"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex.: Análise SWOT"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Profissional (catálogo E33)</Label>
              <Controller
                control={form.control}
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
            </div>
            <div className="space-y-2">
              <Label>Entregável relacionado (opcional)</Label>
              <Input
                placeholder="Ex.: Assinatura de e-mail"
                {...form.register("deliverable_hint")}
              />
              <p className="text-[10px] text-muted-foreground">
                Só para você achar depois — não vincula ao projeto automaticamente.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Texto do prompt</Label>
              <textarea
                rows={10}
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Você é… Cliente [CLIENTE]…"
                {...form.register("body")}
              />
              {form.formState.errors.body && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.body.message}
                </p>
              )}
              {detectedVars.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Variáveis detectadas:{" "}
                  {detectedVars.map((v) => `[${v}]`).join(", ")}
                </p>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_PROMPT_VARIABLES.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 font-mono text-[10px]"
                    onClick={() => insertVariable(v)}
                  >
                    + [{v}]
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
