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
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { projectLinkKindLabels } from "@/lib/format";
import type { ProjectLink } from "@/types/database";
import { cn } from "@/lib/utils";

const kinds = Object.entries(projectLinkKindLabels) as [
  ProjectLinkFormValues["kind"],
  string,
][];

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
    defaultValues: { name: "", url: "", kind: "link" },
  });

  function onSubmit(values: ProjectLinkFormValues) {
    startTransition(async () => {
      const result = await createProjectLink(projectId, values);
      if (result.ok) {
        toast.success("Link adicionado.");
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este link?")) return;
    startTransition(async () => {
      const result = await deleteProjectLink(id, projectId);
      if (result.ok) {
        toast.success("Link excluído.");
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
          Drive, Figma, GitHub, pastas compartilhadas — tudo em um lugar.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          <Plus className="size-4" />
          Adicionar link
        </Button>
      </div>

      {open && (
        <Card className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input placeholder="Ex.: Pasta do projeto" {...register("name")} />
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
              <Label>URL *</Label>
              <Input placeholder="https://..." {...register("url")} />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Salvar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {initial.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum link cadastrado ainda.
        </Card>
      ) : (
        <ul className="space-y-2">
          {initial.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{link.name}</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  {projectLinkKindLabels[link.kind]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <ExternalLink className="size-3.5" />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleDelete(link.id)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
