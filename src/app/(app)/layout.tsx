import { AppShell } from "@/components/layout/app-shell";
import { getHubRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getHubRole();
  if (role === "client") {
    redirect("/portal");
  }
  return <AppShell>{children}</AppShell>;
}
