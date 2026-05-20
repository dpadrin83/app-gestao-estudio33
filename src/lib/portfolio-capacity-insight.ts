import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PortfolioGanttData } from "@/lib/queries/portfolio-gantt";

export type PortfolioCapacityInsight = {
  tone: "ok" | "warning" | "critical";
  title: string;
  detail: string;
};

export function buildPortfolioCapacityInsight(
  capacity: {
    hoursWeek: number;
    hoursLimit: number;
    percent: number;
    withinLimit: boolean;
  },
  portfolio: PortfolioGanttData,
): PortfolioCapacityInsight | null {
  if (portfolio.projectsInProgress === 0) return null;

  const parts: string[] = [];
  let tone: PortfolioCapacityInsight["tone"] = "ok";

  if (portfolio.horizonEndDate) {
    parts.push(
      `Horizonte do portfólio: ${portfolio.daysToCompleteAll} dia${portfolio.daysToCompleteAll === 1 ? "" : "s"} (até ${format(new Date(portfolio.horizonEndDate), "dd MMM yyyy", { locale: ptBR })}).`,
    );
  }

  parts.push(
    `Esta semana: ${capacity.hoursWeek}h registadas de ${capacity.hoursLimit}h úteis (${capacity.percent}%).`,
  );

  if (portfolio.projectsOverdue > 0) {
    tone = "critical";
    parts.unshift(
      `${portfolio.projectsOverdue} projeto${portfolio.projectsOverdue === 1 ? "" : "s"} com prazo vencido no portfólio.`,
    );
  } else if (!capacity.withinLimit) {
    tone = "warning";
    parts.push("Carga acima do limite semanal — priorize ou renegocie prazos.");
  } else if (
    portfolio.daysToCompleteAll > 45 &&
    capacity.percent >= 75 &&
    portfolio.projectsInProgress >= 2
  ) {
    tone = "warning";
    parts.push(
      "Horizonte longo com semana quase cheia — distribua entregas entre projetos.",
    );
  }

  const title =
    tone === "critical"
      ? "Capacidade e prazos em risco"
      : tone === "warning"
        ? "Capacidade apertada"
        : "Capacidade vs. portfólio";

  return { tone, title, detail: parts.join(" ") };
}
