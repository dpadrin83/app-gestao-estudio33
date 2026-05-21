"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectLinkSchema,
  type ProjectLinkFormValues,
} from "@/lib/schemas/project-link";
import {
  createProjectLink,
  deleteProjectLink,
} from "@/lib/actions/project-links";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Plus, Trash2, ExternalLink, Eye, EyeOff, Copy, Shield } from "lucide-react";
import { toast } from "sonner";
import { projectLinkKindLabels } from "@/lib/format";
import type { ProjectLink } from "@/types/database";
import { cn } from "@/lib/utils";

const kinds = Object.entries(projectLinkKindLabels) as [
  ProjectLinkFormValues["kind"],
  string,
][];

const emptyForm: ProjectLinkFormValues = {
  name: "",
  url: "",
  username: "",
  secret_note: "",
  kind: "link",
};

function AccessRow({
  link,
  pending,
  onDelete,
}: {
  link: ProjectLink;
  pending: boolean;
  onDelete: (id: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  async function copySecret() {
    if (!link.secret_note) return;
    try {
      await navigator.clipboard.writeText(link.secret_note);
      toast.success("Copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <li className="rounded-lg border border-border bg-card/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{link.name}</p>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            {projectLinkKindLabels[link.kind]}
          </p>
          {link.username && (
            <p className="mt-1 text-xs text-muted-foreground">
              Usuário: <span className="font-mono text-foreground">{link.username}</span>
            </p>
          )}
          {link.secret_note && (
            <p className="mt-1 break-all font-mono text-xs">
              {showSecret ? link.secret_note : "••••••••••••"}
            </p>
          )}
          {link.url && (
            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
              {link.url}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {link.secret_note && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setShowSecret((s) => !s)}
                title={showSecret ? "Ocultar" : "Mostrar senha"}
              >
                {showSecret ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={pending}
                onClick={copySecret}
                title="Copiar"
              >
                <Copy className="size-3.5" />
              </Button>
            </>
          )}
          {link.url && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
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
            onClick={() => onDelete(link.id)}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export function ProjectLinks({
  projectId,
  links: initial,
}: {
  projectId: string;
  links: ProjectLink[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProjectLinkFormValues>({
    resolver: zodResolver(ProjectLinkSchema),
    defaultValues: emptyForm,
  });

  function onSubmit(values: ProjectLinkFormValues) {
    startTransition(async () => {
      const result = await createProjectLink(projectId, values);
      if (result.ok) {
        toast.success("Acesso salvo.");
        reset(emptyForm);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este acesso?")) return;
    startTransition(async () => {
      const result = await deleteProjectLink(id, projectId);
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
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <Shield className="mt-0.5 size-3.5 shrink-0 text-brand-orange" />
        <p>
          Credenciais e links deste projeto ficam só no Hub (admin). Não aparecem
          na ficha do cliente nem no portal — apenas entregáveis marcados para o
          cliente vão para lá.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          GitHub, Supabase, Vercel, Figma, pasta local, senhas e API keys.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen((o) => !o)}
        >
          <Plus className="size-4" />
          Adicionar acesso
        </Button>
      </div>

      {open && (
        <Card className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex.: Supabase produção"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
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
            </div>
            <div className="space-y-2">
              <Label>URL (opcional se tiver senha)</Label>
              <Input placeholder="https://supabase.com/dashboard/..." {...register("url")} />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url.message}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Usuário / e-mail</Label>
                <Input placeholder="opcional" {...register("username")} />
              </div>
              <div className="space-y-2">
                <Label>Senha / API key / nota</Label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="anon key, service role, senha DB…"
                  {...register("secret_note")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Salvar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {initial.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum acesso cadastrado. Comece pelo Supabase e GitHub ao criar o
          projeto.
        </Card>
      ) : (
        <ul className="space-y-2">
          {initial.map((link) => (
            <AccessRow
              key={link.id}
              link={link}
              pending={pending}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
