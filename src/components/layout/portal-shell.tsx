import Link from "next/link";
import { LogoE33 } from "@/components/logo-e33";
import { PortalBackground } from "@/components/portal/portal-background";
import { PortalClientBrand } from "@/components/portal/portal-client-brand";
import { UserMenu } from "@/components/layout/user-menu";
import { getPortalClientBranding } from "@/lib/actions/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PortalShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const branding = await getPortalClientBranding();

  return (
    <div className="relative min-h-screen bg-background">
      {branding?.backgroundUrl && (
        <PortalBackground backgroundUrl={branding.backgroundUrl} />
      )}
      <div className="brand-stripe relative z-10 h-[3px] w-full" />
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
            <Link
              href="/portal"
              className="flex shrink-0 items-center gap-2 border-r border-border pr-4 sm:pr-6"
            >
              <LogoE33 className="h-6" />
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                Portal
              </span>
            </Link>
            {branding && (
              <PortalClientBrand
                name={branding.clientName}
                logoUrl={branding.logoUrl}
                segment={null}
                size="sm"
                className="min-w-0 [&_p:last-child]:hidden"
              />
            )}
          </div>
          <UserMenu email={user?.email ?? ""} />
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
