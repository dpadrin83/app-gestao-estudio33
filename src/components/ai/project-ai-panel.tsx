"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateWeeklySummary } from "@/lib/actions/ai";
import type { AiGeneration } from "@/types/database";
import { formatDate } from "@/lib/format";

export function ProjectAiPanel({
  projectId,
  recentSummaries,
  aiConfigured,
}: {
  projectId: string;
  recentSummaries: AiGeneration[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [latest, setLatest] = useState<string | null>(
    recentSummaries[0]?.content ?? null,
  );

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateWeeklySummary(projectId);
      if (result.ok && result.data) {
        setLatest(result.data.content);
        toast.success("Resumo gerado.");
        router.refresh();
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function handleCopy() {
    if (!latest) return;
    void navigator.clipboard.writeText(latest);
    toast.success("Copiado para a área de transferência.");
  }

  return (
    <Card className="border-brand-purple/30 bg-brand-purple/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-brand-purple">
            <Sparkles className="size-3.5" />
            Resumo IA
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status semanal em bullets — para você ou para enviar ao cliente.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={pending || !aiConfigured}
        >
          {pending ? "Gerando…" : "Gerar resumo"}
        </Button>
      </div>

      {!aiConfigured && (
        <p className="mt-3 text-sm text-warning">
          Adicione <code className="text-xs">ANTHROPIC_API_KEY</code> no{" "}
          <code className="text-xs">.env.local</code> e reinicie o servidor.
        </p>
      )}

      {latest && (
        <div className="mt-4 rounded-lg border border-border bg-card/80 p-4">
          <div className="mb-2 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="size-3.5" />
              Copiar
            </Button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {latest}
          </pre>
        </div>
      )}

      {recentSummaries.length > 1 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Histórico ({recentSummaries.length - (latest ? 1 : 0)} anteriores)
          </summary>
          <ul className="mt-2 space-y-2">
            {recentSummaries.slice(latest ? 1 : 0).map((g) => (
              <li
                key={g.id}
                className="rounded border border-border/60 p-2 text-xs text-muted-foreground"
              >
                <span className="font-mono">{formatDate(g.created_at)}</span>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-foreground/80">
                  {g.content}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
