"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clientReviewDeliverable } from "@/lib/actions/deliverables";
import { DeliverableStatusBadge } from "@/components/deliverable-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";
import { SchedulePhaseSwimlanes } from "@/components/schedule/schedule-phase-swimlanes";
import {
  activityPhaseLabels,
  deliverableTypeLabels,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import type { DeliverableWithVersions, Activity } from "@/types/database";

export function PortalProjectView({
  projectId,
  milestones,
  visibleActivities,
  deliverables,
}: {
  projectId: string;
  milestones: Activity[];
  visibleActivities: Activity[];
  deliverables: DeliverableWithVersions[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<Record<string, string>>({});

  function review(deliverableId: string, decision: "approved" | "rejected") {
    const body = comments[deliverableId]?.trim() ?? "";
    if (decision === "rejected" && body.length < 2) {
      toast.error("Escreva o motivo da reprovação.");
      return;
    }
    startTransition(async () => {
      const result = await clientReviewDeliverable(deliverableId, projectId, decision, {
        body: body || (decision === "approved" ? "Aprovado." : ""),
      });
      if (result.ok) {
        toast.success(decision === "approved" ? "Aprovado. Obrigado!" : "Feedback enviado.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const pendingApproval = deliverables.filter((d) => d.status === "sent_to_client");

  return (
    <div className="space-y-10">
      {visibleActivities.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cronograma por fase</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Atividades compartilhadas com você neste projeto.
          </p>
          <SchedulePhaseSwimlanes activities={visibleActivities} readOnly />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Próximos marcos</h2>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum marco visível ainda.</p>
        ) : (
          <ul className="space-y-2">
            {milestones.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    {activityPhaseLabels[m.phase]}
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatDate(m.planned_end_date)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Entregáveis</h2>
        {deliverables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum entregável compartilhado ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => {
              const latest = d.versions[0];
              return (
                <Card key={d.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">
                        {deliverableTypeLabels[d.type]}
                        {latest && ` · versão ${latest.version_number}`}
                      </p>
                    </div>
                    <DeliverableStatusBadge status={d.status} />
                  </div>
                  {latest?.external_link && (
                    <a
                      href={latest.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-brand-orange hover:underline"
                    >
                      <ExternalLink className="size-4" />
                      Abrir entregável
                    </a>
                  )}
                  {d.comments.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-border pt-3">
                      {d.comments.map((c) => (
                        <li key={c.id} className="text-sm">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatDateTime(c.created_at)}
                          </span>
                          <p>{c.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {d.status === "sent_to_client" && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div>
                        <Label htmlFor={`c-${d.id}`}>Comentário</Label>
                        <textarea
                          id={`c-${d.id}`}
                          rows={3}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Opcional na aprovação."
                          value={comments[d.id] ?? ""}
                          onChange={(e) =>
                            setComments((prev) => ({
                              ...prev,
                              [d.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => review(d.id, "approved")}
                        >
                          <Check className="size-4" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => review(d.id, "rejected")}
                        >
                          <X className="size-4" />
                          Reprovar
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        {pendingApproval.length > 0 && (
          <p className="mt-4 text-sm text-brand-orange">
            {pendingApproval.length} entregável(is) aguardando sua avaliação.
          </p>
        )}
      </section>
    </div>
  );
}
