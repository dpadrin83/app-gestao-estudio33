import { NextResponse } from "next/server";
import { format } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActivityPhase, ActivityKind } from "@/types/database";

type BriefingPayload = {
  client_name: string;
  client_email?: string;
  project_name: string;
  briefing?: string;
  description?: string;
  contract_value?: number;
  start_date?: string;
  expected_end_date?: string;
  activities?: Array<{
    name: string;
    phase?: ActivityPhase;
    kind?: ActivityKind;
    estimated_duration_days?: number;
    visible_to_client?: boolean;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.BRIEFING_STUDIO_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "BRIEFING_STUDIO_SECRET não configurado no servidor." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || token !== secret) {
    return unauthorized();
  }

  let body: BriefingPayload;
  try {
    body = (await request.json()) as BriefingPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.client_name?.trim() || !body.project_name?.trim()) {
    return NextResponse.json(
      { error: "client_name e project_name são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    let clientId: string;
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", body.client_name.trim())
      .limit(1)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: body.client_name.trim(),
          email: body.client_email?.trim() || null,
          status: "active",
        })
        .select("id")
        .single();

      if (clientError || !newClient) {
        console.error("[briefing-studio] client", clientError);
        return NextResponse.json(
          { error: "Erro ao criar cliente." },
          { status: 500 },
        );
      }
      clientId = newClient.id;
    }

    const briefingText =
      body.briefing?.trim() || body.description?.trim() || null;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: clientId,
        name: body.project_name.trim(),
        description: body.description?.trim() || null,
        briefing_notes: briefingText,
        status: "in_progress",
        start_date: body.start_date ?? format(new Date(), "yyyy-MM-dd"),
        expected_end_date: body.expected_end_date ?? null,
        contract_value: body.contract_value ?? null,
      })
      .select("id")
      .single();

    if (projectError || !project) {
      console.error("[briefing-studio] project", projectError);
      return NextResponse.json(
        { error: "Erro ao criar projeto." },
        { status: 500 },
      );
    }

    const activities = body.activities ?? [];
    if (activities.length > 0) {
      const start = body.start_date ?? format(new Date(), "yyyy-MM-dd");
      let cursor = new Date(start + "T12:00:00");

      for (let i = 0; i < activities.length; i++) {
        const a = activities[i]!;
        const kind = a.kind ?? "activity";
        const duration =
          kind === "milestone"
            ? 0
            : Math.max(a.estimated_duration_days ?? 1, 1);
        const plannedStart = format(cursor, "yyyy-MM-dd");
        const endDate = new Date(cursor);
        if (kind !== "milestone") {
          endDate.setDate(endDate.getDate() + duration - 1);
        }
        const plannedEnd = format(endDate, "yyyy-MM-dd");

        await supabase.from("activities").insert({
          project_id: project.id,
          name: a.name.trim(),
          phase: a.phase ?? "production",
          kind,
          estimated_duration_days: duration,
          planned_start_date: plannedStart,
          planned_end_date: plannedEnd,
          status: "not_started",
          visible_to_client: a.visible_to_client ?? kind === "milestone",
          sort_order: i,
        });

        cursor = new Date(endDate);
        cursor.setDate(cursor.getDate() + 1);
      }

      await supabase.rpc("recalculate_project_schedule", {
        p_project_id: project.id,
      });
    }

    await supabase.from("ai_generations").insert({
      project_id: project.id,
      kind: "briefing_import",
      content: `Import Briefing Studio: ${body.project_name}`,
      metadata: { client_name: body.client_name, activities: activities.length },
    });

    return NextResponse.json({
      ok: true,
      client_id: clientId,
      project_id: project.id,
      hub_url: `/projects/${project.id}`,
    });
  } catch (e) {
    console.error("[briefing-studio]", e);
    return NextResponse.json(
      { error: "Erro interno ao importar briefing." },
      { status: 500 },
    );
  }
}
