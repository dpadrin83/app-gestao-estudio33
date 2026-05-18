import Link from "next/link";
import { LogoE33 } from "@/components/logo-e33";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <div className="brand-stripe sticky top-0 z-50" />

      <header className="sticky top-[3px] z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <LogoE33 className="h-6 w-auto text-foreground" />
            <span className="rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hub
            </span>
          </Link>
          <div className="ml-auto">
            <UserMenu email={user?.email ?? ""} />
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-border md:block">
          <SidebarNav />
        </aside>
        <div className="min-w-0">
          <div className="md:hidden border-b border-border px-2 py-2">
            <SidebarNav variant="mobile" />
          </div>
          <main className="px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
