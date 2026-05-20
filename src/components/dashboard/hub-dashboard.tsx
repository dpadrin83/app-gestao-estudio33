import Link from "next/link";
import { format, differenceInCalendarDays, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Zap, Calendar, Globe } from "lucide-react";
import type { HubDashboardData, HubCalendarDay } from "@/lib/queries/dashboard-hub";
import { initials } from "@/lib/queries/dashboard-hub";
import { formatCurrency, formatDuration, projectStatusLabels } from "@/lib/format";
import { ProjectRowTimer } from "@/app/(app)/projects/project-row-timer";
import { DashboardInsights } from "@/components/ai/dashboard-insights";
import { DashboardPortfolioGantt } from "@/components/dashboard/dashboard-portfolio-gantt";
import { PortfolioOverdueHeroAlert } from "@/components/dashboard/portfolio-overdue-hero-alert";
import type {
  PortfolioGanttData,
  PortfolioGanttSort,
} from "@/lib/queries/portfolio-gantt";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/queries/projects-list";
import type { SmartAlert } from "@/lib/alerts/smart-alerts";

const PROJECT_ACCENTS = [
  {
    row: "from-brand-orange/18 to-brand-orange/6 border-brand-orange/30",
    thumb: "bg-brand-orange",
    bar: "bg-brand-orange shadow-[0_0_6px_rgba(255,84,0,0.6)]",
  },
  {
    row: "from-brand-pink/18 to-brand-pink/6 border-brand-pink/30",
    thumb: "bg-brand-pink",
    bar: "bg-brand-pink shadow-[0_0_6px_rgba(255,0,84,0.6)]",
  },
  {
    row: "from-brand-blue/18 to-brand-blue/6 border-brand-blue/30",
    thumb: "bg-brand-blue",
    bar: "bg-brand-blue shadow-[0_0_6px_rgba(45,121,230,0.6)]",
  },
  {
    row: "from-brand-magenta/18 to-brand-magenta/6 border-brand-magenta/30",
    thumb: "bg-brand-magenta",
    bar: "bg-brand-magenta shadow-[0_0_6px_rgba(197,42,175,0.6)]",
  },
  {
    row: "from-brand-purple/18 to-brand-purple/6 border-brand-purple/30",
    thumb: "bg-brand-purple",
    bar: "bg-brand-purple shadow-[0_0_6px_rgba(92,40,219,0.6)]",
  },
] as const;

type HubDashboardProps = HubDashboardData & {
  portfolioGantt: PortfolioGanttData;
  portfolioGanttClients: { id: string; name: string }[];
  portfolioClientId?: string;
  portfolioSort: PortfolioGanttSort;
  aiConfigured: boolean;
  smartAlerts: SmartAlert[];
};

export function HubDashboard({
  greeting,
  firstName,
  dateLabel,
  heroSummary,
  focus,
  pendingDeliverablesCount,
  overdueActivitiesCount,
  calendar,
  finance,
  featuredProject,
  nextActivity,
  weekForecast,
  capacity,
  projects,
  activeSession,
  renewals,
  portfolioGantt,
  portfolioGanttClients,
  portfolioClientId,
  portfolioSort,
  aiConfigured,
  smartAlerts,
}: HubDashboardProps) {
  return (
    <>
      {/* Hero */}
      <header className="mb-7">
        <span className="mb-3 block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Dashboard · {dateLabel}
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-[42px] md:leading-[1.05]">
          {greeting},{" "}
          <span className="text-brand-grad">{firstName}.</span>
        </h1>
        <p className="mt-3 max-w-[680px] text-[15px] leading-relaxed text-muted-foreground">
          {heroSummary}
        </p>
      </header>

      <PortfolioOverdueHeroAlert
        projectsOverdue={portfolioGantt.projectsOverdue}
      />

      {activeSession && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-success/40 bg-success/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="size-2 animate-pulse rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-success/80">
                Sessão em curso
              </p>
              <Link
                href={`/projects/${activeSession.project.id}`}
                className="text-sm font-semibold hover:underline"
              >
                {activeSession.project.name}
              </Link>
            </div>
          </div>
          <ProjectRowTimer
            projectId={activeSession.project.id}
            isActiveForThis
          />
        </div>
      )}

      <DashboardPortfolioGantt
        data={portfolioGantt}
        clients={portfolioGanttClients}
        selectedClientId={portfolioClientId}
        selectedSort={portfolioSort}
        capacity={capacity}
      />

      {/* Aurora grid */}
      <div className="mb-9 grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Foco do dia */}
        {focus && (
          <section className="card-solid-purple relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl border border-white/14 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] lg:col-span-5 lg:p-[22px]">
            <div>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg border border-white/24 bg-white/16 text-base text-white">
                  <Zap className="size-4" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/24 bg-white/16 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-white">
                  Foco de hoje
                </span>
              </div>
              <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                {focus.eyebrow}
              </p>
              <h3 className="mb-2 text-[19px] font-semibold leading-snug tracking-tight text-white">
                {focus.title}
              </h3>
              <p className="text-xs leading-relaxed text-white/75">{focus.body}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/16 pt-3.5 font-mono text-[11px] text-white/70">
              <span>{focus.footer}</span>
              <Link
                href={focus.href}
                className="rounded-full border border-white/24 bg-white/16 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white transition hover:bg-white/25"
              >
                Abrir →
              </Link>
            </div>
          </section>
        )}

        {/* KPI stack */}
        <div className="flex flex-col gap-3.5 lg:col-span-3">
          <KpiMini
            icon="!"
            tone="orange"
            status="live"
            pulse
            label="Aguardando cliente"
            value={String(pendingDeliverablesCount).padStart(2, "0")}
            href={pendingDeliverablesCount > 0 ? "/projects" : undefined}
          />
          <KpiMini
            icon="⚠"
            tone="pink"
            status={overdueActivitiesCount > 0 ? "atrasado" : "ok"}
            statusVariant={overdueActivitiesCount > 0 ? "danger" : "muted"}
            label="Prazo estourado"
            value={String(overdueActivitiesCount).padStart(2, "0")}
            highlight={overdueActivitiesCount > 0}
            href="/schedule"
          />
        </div>

        {/* Calendário */}
        <section className="card-glass relative min-h-[240px] overflow-hidden rounded-3xl p-5 lg:col-span-4">
          <div className="mb-3.5 flex items-start justify-between">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Cronograma · {calendar.monthTitle}
              </p>
              <h3 className="text-lg font-semibold tracking-tight">
                Calendário de entregas
              </h3>
            </div>
            <Link
              href="/schedule"
              className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition hover:text-foreground"
              aria-label="Abrir cronograma"
            >
              <Calendar className="size-3.5" />
            </Link>
          </div>
          <p className="mb-3 border-b border-border pb-2.5 text-[11px] text-muted-foreground">
            {calendar.subtitle}
          </p>
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] text-muted-foreground">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendar.days.map((day) => (
              <CalDay key={day.date.toISOString()} day={day} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <LegendDot color="bg-brand-orange" label="Entrega" />
            <LegendDot color="bg-brand-pink" label="Marco" />
            <LegendDot color="bg-brand-yellow" label="Aprovação" />
          </div>
        </section>

        {/* Faturamento */}
        <section className="card-glass card-finance-tint relative flex min-h-[280px] flex-col rounded-3xl p-5 lg:col-span-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/65">
                Faturamento · Pipeline
              </p>
              <h3 className="text-lg font-semibold tracking-tight">
                Receita contratada
              </h3>
            </div>
            <Link
              href="/finance"
              className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              ⟳
            </Link>
          </div>
          <div className="mt-auto flex justify-between font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {finance.monthLabels.map((m, i) => (
              <span
                key={m}
                className={cn(
                  finance.bars[i]?.isCurrent && "font-bold text-brand-yellow",
                )}
              >
                {m}
              </span>
            ))}
          </div>
          <div className="mb-4 grid h-[100px] grid-cols-12 items-end gap-1">
            {finance.bars.map((bar, i) => (
              <div
                key={finance.monthLabels[i]}
                className={cn(
                  "rounded-full",
                  bar.isCurrent &&
                    "border border-brand-yellow/45 bg-gradient-to-t from-[#C99500] to-brand-yellow shadow-[0_4px_14px_rgba(255,189,0,0.25)]",
                  bar.isPast && !bar.isCurrent && "bg-brand-yellow/30",
                  bar.isFuture && "bg-white/[0.07]",
                )}
                style={{ height: `${bar.heightPercent}%` }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3.5">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Recebido (mês)
              </p>
              <span className="inline-flex rounded-full border border-brand-yellow/22 bg-brand-yellow/10 px-3.5 py-1.5 text-xs font-semibold">
                {finance.currentMonthLabel} ·{" "}
                {formatCurrency(finance.currentMonthValue)}
              </span>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Meta anual
              </p>
              <p className="font-mono text-2xl font-bold">
                {finance.annualProgressPercent}%
              </p>
            </div>
          </div>
        </section>

        {/* Projeto destaque */}
        {featuredProject && (
          <section className="card-glass relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl p-0 lg:col-span-3">
            <div className="relative h-[150px] bg-gradient-to-br from-brand-orange via-brand-magenta to-brand-purple">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,189,0,0.4),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(45,121,230,0.4),transparent_40%)] mix-blend-screen" />
              <span className="absolute left-3 top-3 z-10 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white">
                {featuredProject.tag}
              </span>
              <div className="absolute bottom-3 left-3.5 right-3.5 z-10">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {featuredProject.serviceLine ?? "Projeto"}
                </p>
                <h3 className="text-base font-semibold text-white">
                  {featuredProject.clientName}
                </h3>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-3.5 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-brand-pink">●</span>
                {featuredProject.nextHint}
              </p>
              <Link
                href={`/projects/${featuredProject.id}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-secondary py-2.5 text-xs font-medium transition hover:bg-white/8"
              >
                Abrir projeto
              </Link>
            </div>
          </section>
        )}

        {/* Próxima atividade */}
        <section className="card-glass relative flex min-h-[280px] flex-col justify-between rounded-3xl p-5 lg:col-span-3">
          {nextActivity ? (
            <>
              <div>
                <div className="mb-3.5 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/16 bg-brand-purple text-base shadow-[0_4px_12px_rgba(92,40,219,0.3)]">
                    ⏰
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Próxima atividade
                    </p>
                    <h4 className="text-sm font-semibold leading-tight">
                      {nextActivity.name}
                      {nextActivity.projectName !== "Operação" && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {nextActivity.projectName}
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
                <p className="border-b border-border pb-3 text-xs leading-relaxed text-muted-foreground">
                  {nextActivity.isDelayed ? (
                    <>
                      Atividade{" "}
                      <strong className="text-foreground">atrasada</strong>.{" "}
                    </>
                  ) : null}
                  {nextActivity.detail}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="text-success before:mr-1 before:content-['✓']">
                  {nextActivity.isDelayed ? "Atenção" : "No radar"}
                </span>
                {nextActivity.projectId ? (
                  <Link
                    href={`/projects/${nextActivity.projectId}#cronograma`}
                    className="rounded-full border border-border bg-card px-2.5 py-1 hover:text-foreground"
                  >
                    Cronograma
                  </Link>
                ) : (
                  <Link
                    href="/schedule"
                    className="rounded-full border border-border bg-card px-2.5 py-1 hover:text-foreground"
                  >
                    Ver agenda
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade urgente na fila.
            </p>
          )}
        </section>

        {/* Forecast semana */}
        <section className="card-glass relative min-h-[200px] rounded-3xl p-5 lg:col-span-7">
          <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                5 dias úteis · semana
              </p>
              <h3 className="text-[17px] font-semibold tracking-tight">
                Carga prevista por dia
              </h3>
            </div>
            <Link
              href="/schedule"
              className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              Cronograma global
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {weekForecast.map((day) => (
              <div
                key={day.key}
                className={cn(
                  "rounded-xl border border-border bg-gradient-to-b from-white/[0.05] to-white/[0.01] px-2.5 py-3.5 text-center transition hover:-translate-y-0.5",
                  day.isToday && "border-brand-pink bg-gradient-to-b from-brand-pink/12 to-brand-pink/[0.02]",
                )}
              >
                <p className="mb-2 text-[11px] font-medium capitalize text-muted-foreground">
                  {day.label}
                </p>
                <ForecastIcon tone={day.tone} />
                <p className="my-1.5 font-mono text-[13px] font-semibold">
                  {day.count}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {day.statusLabel}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Capacidade */}
        <section className="relative min-h-[200px] overflow-hidden rounded-3xl border border-white/14 bg-gradient-to-br from-brand-blue to-[#1A5BB8] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] lg:col-span-5">
          <div className="mb-3.5 flex items-start justify-between">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                Capacidade · Semana
              </p>
              <h3 className="text-lg font-semibold text-white">Horas alocadas</h3>
            </div>
            <span className="inline-flex rounded-full border border-white/24 bg-white/16 px-2.5 py-0.5 font-mono text-[10px] uppercase text-white">
              ao vivo
            </span>
          </div>
          <p className="mb-4 border-b border-white/16 pb-3.5 text-xs leading-relaxed text-white/75">
            Total registrado em time tracking esta semana. Limite saudável:{" "}
            {capacity.hoursLimit}h úteis.
          </p>
          <div className="relative mb-3.5 flex h-10 items-center overflow-hidden rounded-full border border-white/24 bg-white/16 px-4">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white transition-all"
              style={{ width: `${capacity.percent}%` }}
            />
            <div className="relative z-[2] flex w-full justify-between font-mono text-xs font-semibold">
              <span className={capacity.percent > 40 ? "text-[#1a1a1a]" : "text-white"}>
                {formatDuration(capacity.hoursWeek * 3_600_000)}
              </span>
              <span className="text-white/90">{capacity.hoursLimit}h limite</span>
            </div>
            <div
              className="absolute top-1/2 z-[3] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brand-purple text-xs text-white shadow-lg"
              style={{ left: `calc(${capacity.percent}% - 16px)` }}
            >
              ●
            </div>
          </div>
          <div className="flex justify-between font-mono text-[11px] text-white/80">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full",
                  capacity.withinLimit ? "bg-success" : "bg-warning",
                )}
              />
              {capacity.withinLimit
                ? "Dentro do limite saudável"
                : "Acima do limite — revise a carga"}
            </span>
            <span>↻ agora</span>
          </div>
        </section>
      </div>

      {/* Renovações */}
      {renewals.length > 0 && (
        <section className="card-glass mb-8 overflow-hidden rounded-2xl border-brand-pink/20">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-brand-pink" />
              Renovações (45 dias)
            </h2>
            <Link
              href="/services"
              className="font-mono text-[10px] uppercase text-brand-orange hover:underline"
            >
              ver todos →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {renewals.slice(0, 4).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.clientName} · vence {r.nextDueDate}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10px] uppercase",
                    r.daysUntil <= 14 ? "text-warning" : "text-muted-foreground",
                  )}
                >
                  {r.daysUntil === 0 ? "hoje" : `${r.daysUntil}d`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DashboardInsights alerts={smartAlerts} aiConfigured={aiConfigured} />

      {/* Projetos ativos */}
      <div className="mb-4 mt-7 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[22px] font-bold tracking-tight">Projetos ativos</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white bg-white px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[#1a1a1a]">
            Todos · {projects.length}
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Em produção · {projects.filter((p) => p.status === "in_progress").length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {projects.length === 0 ? (
          <div className="card-glass rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground">
            Sem projetos em produção.{" "}
            <Link href="/projects/new" className="text-brand-orange hover:underline">
              Criar projeto
            </Link>
          </div>
        ) : (
          projects.map((project, index) => (
            <ProjectHubRow
              key={project.id}
              project={project}
              accent={PROJECT_ACCENTS[index % PROJECT_ACCENTS.length]!}
              activeProjectId={activeSession?.project.id}
            />
          ))
        )}
      </div>
    </>
  );
}

function KpiMini({
  icon,
  tone,
  status,
  statusVariant = "muted",
  label,
  value,
  pulse,
  highlight,
  href,
}: {
  icon: string;
  tone: "orange" | "pink";
  status: string;
  statusVariant?: "danger" | "muted";
  label: string;
  value: string;
  pulse?: boolean;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <section
      className={cn(
        "card-glass flex min-h-[113px] flex-1 flex-col justify-between rounded-3xl px-[18px] py-4",
        highlight &&
          "bg-gradient-to-b from-brand-pink/18 to-brand-pink/[0.04]",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border text-sm text-white",
            tone === "orange" && "border-brand-orange bg-brand-orange",
            tone === "pink" && "border-brand-pink bg-brand-pink",
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
            statusVariant === "danger"
              ? "border-brand-pink/30 bg-brand-pink/15 text-red-300"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          {pulse && (
            <span className="size-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
          )}
          {status}
        </span>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-mono text-[22px] font-semibold leading-none tracking-tight">
          {value}
        </p>
      </div>
    </section>
  );
  if (href) {
    return (
      <Link href={href} className="block flex-1 transition hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

function CalDay({ day }: { day: HubCalendarDay }) {
  const n = getDate(day.date);
  return (
    <div
      className={cn(
        "flex aspect-square items-center justify-center rounded-full border font-mono text-[10px]",
        !day.inMonth && "opacity-35",
        day.mark === "entrega" &&
          "border-brand-orange bg-brand-orange font-semibold text-white",
        day.mark === "marco" &&
          "border-brand-pink bg-brand-pink font-semibold text-white",
        day.mark === "aprov" &&
          "border-brand-yellow bg-brand-yellow font-semibold text-[#1a1a1a]",
        !day.mark && "border-border bg-card text-muted-foreground",
        day.isToday &&
          !day.mark &&
          "border-white text-white shadow-[0_0_0_2px_var(--color-brand-purple)]",
        day.isToday && day.mark && "ring-2 ring-brand-purple ring-offset-1 ring-offset-background",
      )}
    >
      {n}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function ForecastIcon({ tone }: { tone: "entrega" | "busy" | "aprov" | "calm" }) {
  const styles = {
    entrega: "bg-brand-pink/20 text-brand-pink",
    busy: "bg-brand-orange/20 text-brand-orange",
    aprov: "bg-brand-yellow/20 text-brand-yellow",
    calm: "bg-success/20 text-success",
  };
  const icons = { entrega: "●", busy: "▲", aprov: "★", calm: "✓" };
  return (
    <div
      className={cn(
        "mx-auto mb-1.5 flex size-[30px] items-center justify-center rounded-lg text-sm",
        styles[tone],
      )}
    >
      {icons[tone]}
    </div>
  );
}

function ProjectHubRow({
  project,
  accent,
  activeProjectId,
}: {
  project: ProjectListItem;
  accent: (typeof PROJECT_ACCENTS)[number];
  activeProjectId?: string;
}) {
  const clientName =
    project.client && typeof project.client === "object" && "name" in project.client
      ? String(project.client.name)
      : "—";

  const endDate = project.expected_end_date
    ? new Date(project.expected_end_date)
    : null;
  const daysLeft = endDate
    ? differenceInCalendarDays(endDate, new Date())
    : null;
  const isLate = daysLeft != null && daysLeft < 0;
  const progress = project.progressPercent ?? 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "grid gap-3 rounded-2xl border bg-gradient-to-r p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_minmax(0,140px)_auto] md:items-center md:gap-4 md:px-5 md:py-4",
        accent.row,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-white/20 font-mono text-xs font-bold text-white",
            accent.thumb,
          )}
        >
          {initials(clientName)}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background",
              project.atRisk ? "bg-destructive" : project.pendingDeliverables > 0 ? "bg-warning" : "bg-success",
            )}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{project.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {clientName}
            {project.service_line ? ` · ${project.service_line}` : ""}
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <p className="text-[13px] font-medium">
          {project.pendingDeliverables > 0
            ? "Aguardando cliente"
            : projectStatusLabels[project.status]}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {project.pendingDeliverables > 0
            ? `${project.pendingDeliverables} entregável${project.pendingDeliverables === 1 ? "" : "is"}`
            : "em andamento"}
        </p>
      </div>

      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] lowercase before:text-[7px] before:content-['●']",
          project.pendingDeliverables > 0
            ? "border-warning/40 bg-warning/15 text-amber-200"
            : "border-brand-purple/40 bg-brand-purple/20 text-[#BFA9F5]",
        )}
      >
        {project.pendingDeliverables > 0
          ? "aguardando"
          : projectStatusLabels[project.status]}
      </span>

      <div className="flex items-center gap-2.5">
        <span className="min-w-[36px] font-mono text-xs font-semibold">
          {progress}%
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <span
            className={cn("block h-full rounded-full", accent.bar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
        {endDate ? (
          <div
            className={cn(
              "text-right font-mono",
              isLate && "text-destructive",
            )}
          >
            <span className="block text-[13px] font-bold">
              {format(endDate, "dd MMM", { locale: ptBR })}
            </span>
            <span className="text-[10px] uppercase tracking-wider">
              {isLate
                ? `atrasado ${Math.abs(daysLeft!)}d`
                : daysLeft === 0
                  ? "hoje"
                  : `${daysLeft}d`}
            </span>
          </div>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground">—</span>
        )}
        <ProjectRowTimer
          projectId={project.id}
          isActiveForThis={activeProjectId === project.id}
        />
      </div>
    </Link>
  );
}
