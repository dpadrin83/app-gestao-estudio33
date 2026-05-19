import { PortalDashboard as PortalDashboardView } from "@/components/portal/portal-dashboard";
import { getPortalDashboard } from "@/lib/actions/portal";
import { redirect } from "next/navigation";

export default async function PortalHomePage() {
  const dashboard = await getPortalDashboard();
  if (!dashboard) redirect("/login");

  return <PortalDashboardView data={dashboard} />;
}
