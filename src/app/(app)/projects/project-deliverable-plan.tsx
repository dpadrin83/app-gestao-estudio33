"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DeliverableStatusBadge } from "@/components/deliverable-status-badge";
import {
  activityPhaseLabels,
  activityStatusLabels,
  deliverableTypeLabels,
} from "@/lib/format";
import { computeDeliverablePlanStats } from "@/lib/project-phase";
import { PHASE_ORDER } from "@/lib/project-phase";
import type { Activity, DeliverableWithVersions } from "@/types/database";
import { ExternalLink } from "lucide-react";

export function ProjectDeliverablePlan({
  deliverables,
  activities,
}: {
  deliverables: DeliverableWithVersions[];
  activities: Activity[];
}) {
  const stats = computeDeliverablePlanStats(deliverables);
  const activityById = new Map(activities.map((a) => [a.id, a]));

  const byPhase = PHASE_ORDER.map((phase) => {
    const phaseActivities = activities.filter((a) => a.phase === phase);
    const items = deliverables.filter((d) => {
      if (!d.activity_id) return phase === "other";
      const act = activityById.get(d.activity_id);
      return act?.phase === phase;
    });
    const unlinked = deliverables.filter(
      (d) => !d.activity_id && phase === "planning",
    );
    return {
      phase,
      label: activityPhaseLabels[phase],
      activities: phaseActivities,
      items: phase === "planning" ? [...items, ...unlinked] : items,
    };
  }).filter((g) => g.items.length > 0 || g.activities.length > 0);

  if (deliverables.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        <p>Nenhum item no plano de entregas.</p>
        <p className="mt-2">
          Aplique um{" "}
          <Link href="#cronograma" className="text-brand-orange hover:underline">
            template no cronograma
          </Link>{" "}
          para gerar entregas padrão vinculadas às atividades.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Itens no plano" value={String(stats.total)} />
        <StatCard label="Com link/arquivo" value={String(stats.withLink)} />
        <StatCard label="Aprovados" value={String(stats.approved)} />
        <StatCard
          label="Aguardando cliente"
          value={String(stats.pendingClient)}
        />
      </div>

      {byPhase.map((group) => (
        <section key={group.phase}>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          {group.activities.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-muted-foreground">
              {group.activities.map((a) => (
                <li key={a.id}>
                  Cronograma: {a.name} — {activityStatusLabels[a.status]}
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-2">
            {group.items.map((d) => {
              const act = d.activity_id
                ? activityById.get(d.activity_id)
                : null;
              const latest = d.versions[0];
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {deliverableTypeLabels[d.type]}
                      {act && ` · ${act.name}`}
                    </p>
                    {latest?.external_link && (
                      <a
                        href={latest.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-brand-orange hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        Abrir
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DeliverableStatusBadge status={d.status} />
                    {latest && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        v{latest.version_number}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-xs text-muted-foreground">
        Gerencie links e envio ao cliente na seção{" "}
        <Link href="#entregaveis" className="text-brand-orange hover:underline">
          Entregáveis
        </Link>
        .
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
    </Card>
  );
}
