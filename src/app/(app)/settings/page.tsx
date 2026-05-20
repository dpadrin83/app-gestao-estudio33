import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/forms/settings-form";
import { DeployStatusCard } from "@/components/settings/deploy-status-card";
import { DataPurgePanel } from "@/components/settings/data-purge-panel";
import { getAppHourlyRate } from "@/lib/actions/settings";
import { getPublishedDataStats } from "@/lib/actions/data-purge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default async function SettingsPage() {
  const [hourlyRate, dataStats] = await Promise.all([
    getAppHourlyRate(),
    getPublishedDataStats(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Configurações do Hub"
        description="Ajustes globais da operação — sem precisar mexer no Supabase."
      />
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <SettingsForm hourlyRate={hourlyRate} />
        <DeployStatusCard />
      </div>
      <div className="mb-8">
        <DataPurgePanel stats={dataStats} />
      </div>

      <Card className="mb-8 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand-purple">
            <Sparkles className="size-5" />
            <h2 className="text-lg font-semibold">Banco de prompts</h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Cadastre prompts por profissional E33, com variáveis [CLIENTE] e
            [ENTREGAVEL]. Copie para ChatGPT/Claude no dia a dia.
          </p>
        </div>
        <Link
          href="/settings/prompts"
          className={buttonVariants({ className: "w-fit shrink-0" })}
        >
          Abrir banco de prompts
        </Link>
      </Card>
    </>
  );
}
