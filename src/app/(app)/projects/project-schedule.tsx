"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteActivity,
  applyScheduleTemplate,
} from "@/lib/actions/activities";
import { ActivityEditDialog } from "@/components/schedule/activity-edit-dialog";
import { ScheduleClassicGantt } from "@/components/schedule/schedule-classic-gantt";
import { SchedulePhaseSwimlanes } from "@/components/schedule/schedule-phase-swimlanes";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "@/components/schedule/schedule-view-toggle";
import { ScheduleHierarchyTable } from "./schedule-hierarchy-table";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Plus, LayoutTemplate, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScheduleAiDialog } from "@/components/ai/schedule-ai-dialog";
import { toast } from "sonner";
import type {
  ActivityWithDeps,
  ScheduleTemplate,
  TaskWithActivity,
} from "@/types/database";

export function ProjectSchedule({
  projectId,
  activities,
  tasks,
  templates,
  aiConfigured,
}: {
  projectId: string;
  activities: ActivityWithDeps[];
  tasks: TaskWithActivity[];
  templates: ScheduleTemplate[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<ScheduleViewMode>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityWithDeps | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(activity: ActivityWithDeps) {
    setEditing(activity);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta atividade?")) return;
    startTransition(async () => {
      const result = await deleteActivity(id, projectId);
      if (result.ok) {
        toast.success("Atividade excluída.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleApplyTemplate() {
    if (!selectedTemplate) {
      toast.error("Selecione um template.");
      return;
    }
    startTransition(async () => {
      const result = await applyScheduleTemplate(projectId, selectedTemplate);
      if (result.ok) {
        toast.success(`Template aplicado (${result.data?.count} atividades).`);
        setTemplateOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="flex gap-3 border-brand-orange/25 bg-brand-orange/5 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-orange" />
        <div className="text-sm text-muted-foreground">
          <p>
            Para <strong className="text-foreground">Soluções Digitais</strong> e
            demais trilhas do catálogo, use{" "}
            <Link
              href="#plano-entregaveis"
              className="font-medium text-brand-orange hover:underline"
            >
              Plano de entregáveis → Importar do catálogo
            </Link>
            , depois <strong className="text-foreground">Publicar no cronograma</strong>.
          </p>
          <p className="mt-1">
            O botão <strong className="text-foreground">Aplicar template</strong> abaixo
            são modelos antigos (5 opções), não substituem o catálogo.
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Adicionar atividade
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setTemplateOpen(true)}
            disabled={activities.length > 0}
          >
            <LayoutTemplate className="size-4" />
            Aplicar template
          </Button>
          {aiConfigured && (
            <ScheduleAiDialog
              projectId={projectId}
              disabled={activities.length > 0}
              aiConfigured={aiConfigured}
            />
          )}
        </div>
        <ScheduleViewToggle mode={mode} onChange={setMode} />
      </div>

      {mode === "table" && (
        <ScheduleHierarchyTable
          projectId={projectId}
          activities={activities}
          tasks={tasks}
          pending={pending}
          onEditActivity={openEdit}
          onDeleteActivity={handleDelete}
        />
      )}
      {mode === "classic" && (
        <ScheduleClassicGantt
          projectId={projectId}
          activities={activities}
          tasks={tasks}
          onEditActivity={openEdit}
        />
      )}
      {mode === "swimlanes" && (
        <SchedulePhaseSwimlanes
          activities={activities}
          tasks={tasks}
          onEditActivity={openEdit}
        />
      )}

      <ActivityEditDialog
        projectId={projectId}
        activities={activities}
        editing={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar template de cronograma</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Modelos legados (branding, landing, sistema web…). Para Soluções Digitais
            com 20 etapas, use{" "}
            <Link href="#plano-entregaveis" className="text-brand-orange hover:underline">
              Plano de entregáveis → Importar do catálogo
            </Link>
            . Só funciona em projetos sem atividades.
          </p>
          <Select
            value={selectedTemplate}
            onValueChange={(v) => setSelectedTemplate(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTemplateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyTemplate} disabled={pending}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
