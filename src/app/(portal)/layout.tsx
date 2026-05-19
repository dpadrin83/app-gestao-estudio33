import { PortalShell } from "@/components/layout/portal-shell";
import { getHubRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getHubRole();
  if (role !== "client") {
    redirect("/dashboard");
  }
  return <PortalShell>{children}</PortalShell>;
}
