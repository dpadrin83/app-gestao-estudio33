"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateDashboardInsights } from "@/lib/actions/ai";
import type { SmartAlert } from "@/lib/alerts/smart-alerts";

export function DashboardInsights({
  alerts,
  aiConfigured,
}: {
  alerts: SmartAlert[];
  aiConfigured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [insights, setInsights] = useState<string | null>(null);

  function handleInsights() {
    startTransition(async () => {
      const result = await generateDashboardInsights();
      if (result.ok && result.data) {
        setInsights(result.data.content);
        toast.success("Insights gerados.");
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  if (alerts.length === 0 && !aiConfigured) return null;

  return (
    <Card className="mb-8 overflow-hidden border-brand-purple/25">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-brand-purple" />
          Alertas e insights
        </h2>
        {aiConfigured && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleInsights}
            disabled={pending}
          >
            {pending ? "Gerando…" : "Insights IA"}
          </Button>
        )}
      </div>

      {alerts.length > 0 && (
        <ul className="divide-y divide-border">
          {alerts.map((a) => (
            <li key={a.id} className="flex gap-3 px-5 py-3">
              {a.severity === "warning" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
                {a.href && (
                  <Link
                    href={a.href}
                    className="mt-1 inline-block text-xs text-brand-orange hover:underline"
                  >
                    Ver →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {alerts.length === 0 && (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Nenhum alerta automático no momento.
        </p>
      )}

      {insights && (
        <div className="border-t border-border bg-brand-purple/5 px-5 py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-brand-purple">
            Prioridades (IA)
          </p>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {insights}
          </pre>
        </div>
      )}
    </Card>
  );
}
