"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "@/components/schedule/schedule-view-toggle";
import { ActivityEditDialog } from "@/components/schedule/activity-edit-dialog";
import { ScheduleClassicGantt } from "@/components/schedule/schedule-classic-gantt";
import { SchedulePhaseSwimlanes } from "@/components/schedule/schedule-phase-swimlanes";
import { ScheduleHierarchyTable } from "../projects/schedule-hierarchy-table";
import { deleteActivity } from "@/lib/actions/activities";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ScheduleProjectBlock } from "@/lib/queries/schedule-board";
import type { ActivityWithDeps } from "@/types/database";

export function ScheduleGlobalBoard({
  blocks,
}: {
  blocks: ScheduleProjectBlock[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ScheduleViewMode>("table");
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<{
    activity: ActivityWithDeps;
    projectId: string;
    activities: ActivityWithDeps[];
  } | null>(null);

  function handleDelete(id: string, projectId: string) {
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

  if (blocks.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum projeto em produção com cronograma. Abra um projeto e aplique um
        template.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScheduleViewToggle mode={mode} onChange={setMode} />
        <p className="text-xs text-muted-foreground">
          Tabela editável, Gantt clássico ou colunas por fase do projeto.
        </p>
      </div>

      <div className="space-y-10">
        {blocks.map((block) => (
          <ProjectSection
            key={block.project.id}
            block={block}
            mode={mode}
            pending={pending}
            onEdit={(a) =>
              setEditing({
                activity: a,
                projectId: block.project.id,
                activities: block.activities,
              })
            }
            onDelete={(id) => handleDelete(id, block.project.id)}
          />
        ))}
      </div>

      {editing && (
        <ActivityEditDialog
          projectId={editing.projectId}
          activities={editing.activities}
          editing={editing.activity}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function ProjectSection({
  block,
  mode,
  pending,
  onEdit,
  onDelete,
}: {
  block: ScheduleProjectBlock;
  mode: ScheduleViewMode;
  pending: boolean;
  onEdit: (a: ActivityWithDeps) => void;
  onDelete: (id: string) => void;
}) {
  const title = `${block.project.name} · ${block.project.clientName}`;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{block.project.name}</h2>
          <p className="text-sm text-muted-foreground">
            {block.project.clientName}
          </p>
        </div>
        <Link
          href={`/projects/${block.project.id}#cronograma`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Abrir projeto →
        </Link>
      </div>

      {mode === "table" && (
        <ScheduleHierarchyTable
          projectId={block.project.id}
          activities={block.activities}
          tasks={block.tasks}
          pending={pending}
          onEditActivity={onEdit}
          onDeleteActivity={onDelete}
        />
      )}
      {mode === "classic" && (
        <ScheduleClassicGantt
          projectId={block.project.id}
          projectName={title}
          activities={block.activities}
          tasks={block.tasks}
          onEditActivity={onEdit}
        />
      )}
      {mode === "swimlanes" && (
        <SchedulePhaseSwimlanes
          activities={block.activities}
          tasks={block.tasks}
          onEditActivity={onEdit}
        />
      )}
    </section>
  );
}
