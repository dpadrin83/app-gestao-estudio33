import { HubDashboard } from "@/components/dashboard/hub-dashboard";
import { getHubDashboardData } from "@/lib/queries/dashboard-hub";
import { getSmartAlerts } from "@/lib/alerts/smart-alerts";
import { isAiConfigured } from "@/lib/ai/client";

export default async function DashboardPage() {
  const [hub, smartAlerts] = await Promise.all([
    getHubDashboardData(),
    getSmartAlerts(),
  ]);

  return (
    <HubDashboard
      {...hub}
      smartAlerts={smartAlerts}
      aiConfigured={isAiConfigured()}
    />
  );
}
