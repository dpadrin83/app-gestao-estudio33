import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { dashboardPath } from "@/lib/app-paths";

const GANTT_ANCHOR = "portfolio-gantt-export";

export function PortfolioOverdueHeroAlert({
  projectsOverdue,
}: {
  projectsOverdue: number;
}) {
  if (projectsOverdue <= 0) return null;

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/45 bg-destructive/10 px-4 py-3.5 md:px-5"
      role="alert"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-destructive"
          aria-hidden
        />
        <div>
          <p className="font-semibold text-destructive">
            {projectsOverdue} projeto{projectsOverdue === 1 ? "" : "s"} atrasado
            {projectsOverdue === 1 ? "" : "s"} no portfólio
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Revise prazos no cronograma abaixo ou abra o projeto para destravar.
          </p>
        </div>
      </div>
      <Link
        href={`${dashboardPath({ sort: "overdue" })}#${GANTT_ANCHOR}`}
        className="shrink-0 rounded-full border border-destructive/40 bg-background/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-destructive transition hover:bg-destructive/10"
      >
        Ver no Gantt
      </Link>
    </div>
  );
}
