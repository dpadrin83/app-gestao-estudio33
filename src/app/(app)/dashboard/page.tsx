import { HubDashboard } from "@/components/dashboard/hub-dashboard";
import { getHubDashboardData } from "@/lib/queries/dashboard-hub";
import {
  getPortfolioGanttData,
  type PortfolioGanttSort,
} from "@/lib/queries/portfolio-gantt";
import { getSmartAlerts } from "@/lib/alerts/smart-alerts";
import { isAiConfigured } from "@/lib/ai/client";
import { listActiveClients } from "@/lib/actions/projects";

const SORT_VALUES: PortfolioGanttSort[] = [
  "days",
  "name",
  "overdue",
  "progress",
];

function parseSort(value: string | undefined): PortfolioGanttSort {
  if (value && SORT_VALUES.includes(value as PortfolioGanttSort)) {
    return value as PortfolioGanttSort;
  }
  return "days";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const clientId = params.client?.trim() || undefined;
  const sort = parseSort(params.sort);

  const [hub, smartAlerts, portfolioGantt, clients] = await Promise.all([
    getHubDashboardData(),
    getSmartAlerts(),
    getPortfolioGanttData({ clientId, sort }),
    listActiveClients(),
  ]);

  return (
    <HubDashboard
      {...hub}
      portfolioGantt={portfolioGantt}
      portfolioGanttClients={clients}
      portfolioClientId={clientId}
      portfolioSort={sort}
      smartAlerts={smartAlerts}
      aiConfigured={isAiConfigured()}
    />
  );
}
