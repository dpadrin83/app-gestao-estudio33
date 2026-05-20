"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  purgeAllOperationalData,
  purgeDemoData,
  type PublishedDataStats,
} from "@/lib/actions/data-purge";

type ConfirmKind = "demo" | "all" | null;

export function DataPurgePanel({ stats }: { stats: PublishedDataStats }) {
  const router = useRouter();
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [pending, startTransition] = useTransition();

  function runPurge(kind: "demo" | "all") {
    startTransition(async () => {
      const result =
        kind === "demo" ? await purgeDemoData() : await purgeAllOperationalData();
      if (result.ok) {
        const { projects, clients } = result.data!;
        toast.success(
          `Apagado: ${projects} projeto(s) e ${clients} cliente(s).`,
        );
        setConfirmKind(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const demoOpen = confirmKind === "demo";
  const allOpen = confirmKind === "all";

  return (
    <>
      <Card className="border-destructive/25 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="size-5 text-destructive" />
          <h2 className="text-lg font-semibold">Dados publicados no Supabase</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          O que está no banco ligado à Vercel/produção. Apagar remove clientes,
          projetos e tudo que depende deles (cronograma, entregáveis, horas).
          Templates de cronograma, prompts e taxa horária são mantidos.
        </p>

        <dl className="mb-6 grid grid-cols-2 gap-3 font-mono text-sm sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Clientes
            </dt>
            <dd className="text-lg font-semibold">{stats.clients}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Projetos
            </dt>
            <dd className="text-lg font-semibold">{stats.projects}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Demo · clientes
            </dt>
            <dd className="text-lg font-semibold">{stats.demoClients}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Demo · projetos
            </dt>
            <dd className="text-lg font-semibold">{stats.demoProjects}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={stats.demoProjects === 0 && stats.demoClients === 0}
            onClick={() => setConfirmKind("demo")}
          >
            <Trash2 className="size-4" />
            Apagar só dados [DEMO]
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={stats.clients === 0 && stats.projects === 0}
            onClick={() => setConfirmKind("all")}
          >
            <Trash2 className="size-4" />
            Apagar todos os dados
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={demoOpen}
        onOpenChange={(open) => !open && setConfirmKind(null)}
        title="Apagar dados demo?"
        description={`Tem certeza que deseja apagar ${stats.demoProjects} projeto(s) e ${stats.demoClients} cliente(s) com prefixo [DEMO]? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, apagar demo"
        variant="destructive"
        pending={pending}
        onConfirm={() => runPurge("demo")}
      />

      <ConfirmDialog
        open={allOpen}
        onOpenChange={(open) => !open && setConfirmKind(null)}
        title="Apagar todos os dados operacionais?"
        description={`Tem certeza que deseja apagar ${stats.projects} projeto(s) e ${stats.clients} cliente(s) do Hub? Cronogramas, entregáveis e registros de horas serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, tenho certeza"
        variant="destructive"
        pending={pending}
        onConfirm={() => runPurge("all")}
      />
    </>
  );
}
