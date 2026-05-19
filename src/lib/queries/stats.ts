/**
 * Queries de estatísticas para o dashboard.
 * Buscamos as time_sessions de períodos relevantes (semana atual, mês atual)
 * e calculamos durações na app — Postgres não tem função de horas formatadas em PT-BR.
 */
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { durationBetween } from "@/lib/format";
import type { TimeSession } from "@/types/database";

type SessionRow = TimeSession & { project_id: string };

export interface DashboardStats {
  totalMsWeek: number;
  totalMsMonth: number;
  activeProjectsCount: number;
  pendingDeliverablesCount: number;
  perProjectThisWeek: Array<{
    projectId: string;
    projectName: string;
    clientName: string;
    totalMs: number;
  }>;
}

export async function getDashboardStats(now = new Date()): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();

  // semana: segunda → domingo (locale-aware via date-fns weekStartsOn=1)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 1. Conta projetos ativos
  const [activeRes, pendingRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent_to_client"),
  ]);
  const activeProjectsCount = activeRes.count;
  const pendingDeliverablesCount = pendingRes.count;

  // 2. Sessões do mês — usadas para o card de mês E pra derivar a semana
  // (sessões da semana são subconjunto das do mês na maioria dos casos —
  //  exceto na virada do mês, então buscamos o range completo)
  const earliestStart = monthStart < weekStart ? monthStart : weekStart;
  const latestEnd = monthEnd > weekEnd ? monthEnd : weekEnd;

  const { data: sessions } = await supabase
    .from("time_sessions")
    .select("id, project_id, started_at, ended_at, description, created_at")
    .gte("started_at", earliestStart.toISOString())
    .lte("started_at", latestEnd.toISOString())
    .order("started_at", { ascending: false });

  const rows: SessionRow[] = (sessions ?? []) as SessionRow[];

  let totalMsWeek = 0;
  let totalMsMonth = 0;
  const perProjectWeek = new Map<string, number>();

  for (const s of rows) {
    const ms = durationBetween(s.started_at, s.ended_at);
    const startMs = new Date(s.started_at).getTime();
    if (startMs >= monthStart.getTime() && startMs <= monthEnd.getTime()) {
      totalMsMonth += ms;
    }
    if (startMs >= weekStart.getTime() && startMs <= weekEnd.getTime()) {
      totalMsWeek += ms;
      perProjectWeek.set(
        s.project_id,
        (perProjectWeek.get(s.project_id) ?? 0) + ms,
      );
    }
  }

  // 3. Lista de projetos ativos com nome + cliente
  const { data: activeProjects } = await supabase
    .from("projects")
    .select("id, name, client:clients(name)")
    .eq("status", "in_progress")
    .order("name");

  const perProjectThisWeek = (activeProjects ?? []).map((p) => {
    // Supabase retorna client como objeto único quando 1-to-many do lado N
    const client = p.client as unknown as { name?: string } | null;
    return {
      projectId: p.id,
      projectName: p.name,
      clientName: client?.name ?? "—",
      totalMs: perProjectWeek.get(p.id) ?? 0,
    };
  });

  return {
    totalMsWeek,
    totalMsMonth,
    activeProjectsCount: activeProjectsCount ?? 0,
    pendingDeliverablesCount: pendingDeliverablesCount ?? 0,
    perProjectThisWeek,
  };
}
