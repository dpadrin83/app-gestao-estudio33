import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Boa volta, Danilo."
        description="Visão geral será preenchida na próxima etapa do setup."
      />
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          em construção
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cards de horas e lista de projetos ativos vão aparecer aqui.
        </p>
      </div>
    </>
  );
}
