"use server";

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/activities";
import type { ActivityStatus } from "@/types/database";

function syncStatusAfterShift(
  status: ActivityStatus,
  plannedEnd: string,
): ActivityStatus {
  if (status === "completed") return "completed";
  const today = format(new Date(), "yyyy-MM-dd");
  if (
    plannedEnd < today &&
    (status === "not_started" || status === "in_progress")
  ) {
    return "delayed";
  }
  if (status === "delayed" && plannedEnd >= today) {
    return "in_progress";
  }
  return status;
}

async function recalculateSchedule(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("recalculate_project_schedule", {
    p_project_id: projectId,
  });
  if (error) {
    console.error("[recalculate_project_schedule]", error);
  }
}

function revalidateSchedulePaths(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

/** Desloca todas as atividades abertas do projeto (ou o prazo do projeto). */
export async function shiftProjectSchedule(
  projectId: string,
  deltaDays: number,
): Promise<
  ActionResult<{ shifted: number; kind: "activities" | "project" }>
> {
  if (!Number.isInteger(deltaDays) || deltaDays === 0) {
    return { ok: false, error: "Nenhuma alteração." };
  }
  if (deltaDays < -365 || deltaDays > 365) {
    return { ok: false, error: "Deslocamento máximo de ±365 dias." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: activities, error: listErr } = await supabase
    .from("activities")
    .select("id, planned_start_date, planned_end_date, status, kind")
    .eq("project_id", projectId)
    .neq("status", "completed");

  if (listErr) {
    console.error("[shiftProjectSchedule]", listErr);
    return { ok: false, error: "Não foi possível carregar atividades." };
  }

  if (!activities?.length) {
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("expected_end_date")
      .eq("id", projectId)
      .single();

    if (pErr || !project?.expected_end_date) {
      return {
        ok: false,
        error:
          "Adicione atividades ao cronograma ou defina o término previsto do projeto.",
      };
    }

    const newEnd = format(
      addDays(parseISO(project.expected_end_date), deltaDays),
      "yyyy-MM-dd",
    );
    const { error: uErr } = await supabase
      .from("projects")
      .update({ expected_end_date: newEnd })
      .eq("id", projectId);

    if (uErr) {
      console.error("[shiftProjectSchedule project]", uErr);
      return { ok: false, error: "Não foi possível atualizar o projeto." };
    }

    revalidateSchedulePaths(projectId);
    return { ok: true, data: { shifted: 1, kind: "project" } };
  }

  for (const a of activities) {
    const kind = a.kind as string;
    const newStart = format(
      addDays(parseISO(a.planned_start_date as string), deltaDays),
      "yyyy-MM-dd",
    );
    const newEnd =
      kind === "milestone"
        ? newStart
        : format(
            addDays(parseISO(a.planned_end_date as string), deltaDays),
            "yyyy-MM-dd",
          );

    const { error } = await supabase
      .from("activities")
      .update({
        planned_start_date: newStart,
        planned_end_date: newEnd,
        status: syncStatusAfterShift(a.status as ActivityStatus, newEnd),
      })
      .eq("id", a.id);

    if (error) {
      console.error("[shiftProjectSchedule update]", error);
      return { ok: false, error: "Falha ao atualizar atividades." };
    }
  }

  await recalculateSchedule(projectId);
  revalidateSchedulePaths(projectId);
  return {
    ok: true,
    data: { shifted: activities.length, kind: "activities" },
  };
}

/** Ajusta só o término (borda direita) — atividades no prazo máximo do projeto. */
export async function resizeProjectScheduleEnd(
  projectId: string,
  deltaDays: number,
): Promise<
  ActionResult<{ updated: number; kind: "activities" | "project" }>
> {
  if (!Number.isInteger(deltaDays) || deltaDays === 0) {
    return { ok: false, error: "Nenhuma alteração." };
  }
  if (deltaDays < -365 || deltaDays > 365) {
    return { ok: false, error: "Ajuste máximo de ±365 dias." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: activities, error: listErr } = await supabase
    .from("activities")
    .select(
      "id, planned_start_date, planned_end_date, status, kind, estimated_duration_days",
    )
    .eq("project_id", projectId)
    .neq("status", "completed");

  if (listErr) {
    console.error("[resizeProjectScheduleEnd]", listErr);
    return { ok: false, error: "Não foi possível carregar atividades." };
  }

  if (!activities?.length) {
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("expected_end_date")
      .eq("id", projectId)
      .single();

    if (pErr || !project?.expected_end_date) {
      return {
        ok: false,
        error:
          "Adicione atividades ao cronograma ou defina o término previsto do projeto.",
      };
    }

    const newEnd = format(
      addDays(parseISO(project.expected_end_date), deltaDays),
      "yyyy-MM-dd",
    );
    const { error: uErr } = await supabase
      .from("projects")
      .update({ expected_end_date: newEnd })
      .eq("id", projectId);

    if (uErr) {
      return { ok: false, error: "Não foi possível atualizar o projeto." };
    }

    revalidateSchedulePaths(projectId);
    return { ok: true, data: { updated: 1, kind: "project" } };
  }

  const maxEnd = activities.reduce(
    (max, a) =>
      (a.planned_end_date as string) > max
        ? (a.planned_end_date as string)
        : max,
    activities[0]!.planned_end_date as string,
  );

  const targets = activities.filter((a) => a.planned_end_date === maxEnd);
  let updated = 0;

  for (const a of targets) {
    const kind = a.kind as string;
    const start = a.planned_start_date as string;
    let newEnd = format(
      addDays(parseISO(a.planned_end_date as string), deltaDays),
      "yyyy-MM-dd",
    );

    if (kind === "milestone") {
      newEnd = format(addDays(parseISO(start), deltaDays), "yyyy-MM-dd");
    }

    if (newEnd < start) {
      return {
        ok: false,
        error: "O término não pode ser antes do início da atividade.",
      };
    }

    const patch: Record<string, unknown> = {
      planned_end_date: newEnd,
      status: syncStatusAfterShift(a.status as ActivityStatus, newEnd),
    };

    if (kind === "milestone") {
      patch.planned_start_date = newEnd;
      patch.estimated_duration_days = 0;
    } else {
      patch.estimated_duration_days = Math.max(
        1,
        differenceInCalendarDays(parseISO(newEnd), parseISO(start)) + 1,
      );
    }

    const { error } = await supabase
      .from("activities")
      .update(patch)
      .eq("id", a.id);

    if (error) {
      console.error("[resizeProjectScheduleEnd update]", error);
      return { ok: false, error: "Falha ao atualizar atividades." };
    }
    updated += 1;
  }

  await recalculateSchedule(projectId);
  revalidateSchedulePaths(projectId);
  return {
    ok: true,
    data: { updated, kind: "activities" },
  };
}
