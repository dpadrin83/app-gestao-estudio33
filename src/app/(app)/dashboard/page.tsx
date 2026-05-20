import { HubDashboard } from "@/components/dashboard/hub-dashboard";
import { getHubDashboardData } from "@/lib/queries/dashboard-hub";
import { getPortfolioGanttData } from "@/lib/queries/portfolio-gantt";
import { getSmartAlerts } from "@/lib/alerts/smart-alerts";
import { isAiConfigured } from "@/lib/ai/client";

export default async function DashboardPage() {
  const [hub, smartAlerts, portfolioGantt] = await Promise.all([
    getHubDashboardData(),
    getSmartAlerts(),
    getPortfolioGanttData(),
  ]);

  return (
    <HubDashboard
      {...hub}
      portfolioGantt={portfolioGantt}
      smartAlerts={smartAlerts}
      aiConfigured={isAiConfigured()}
    />
  );
}
