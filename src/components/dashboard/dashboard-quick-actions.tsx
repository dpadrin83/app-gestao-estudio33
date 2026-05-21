"use client";

import Link from "next/link";
import {
  Zap,
  Plus,
  FolderKanban,
  GanttChart,
  Users,
  ListChecks,
  Wallet,
} from "lucide-react";
import { QuickProjectDialog } from "@/components/projects/quick-project-dialog";
import { cn } from "@/lib/utils";

const actions = [
  {
    key: "quick",
    label: "Lançar rápido",
    icon: Zap,
    accent: "border-brand-orange/35 bg-brand-orange/10 hover:bg-brand-orange/18",
    iconClass: "text-brand-orange",
  },
  {
    key: "new",
    label: "Novo projeto",
    href: "/projects/new",
    icon: Plus,
    accent: "border-brand-purple/35 bg-brand-purple/10 hover:bg-brand-purple/18",
    iconClass: "text-brand-purple",
  },
  {
    key: "projects",
    label: "Projetos",
    href: "/projects",
    icon: FolderKanban,
    accent: "border-brand-purple/25 bg-white/[0.04] hover:bg-white/[0.08]",
    iconClass: "text-brand-purple",
  },
  {
    key: "schedule",
    label: "Cronograma",
    href: "/schedule",
    icon: GanttChart,
    accent: "border-brand-blue/35 bg-brand-blue/10 hover:bg-brand-blue/18",
    iconClass: "text-brand-blue",
  },
  {
    key: "clients",
    label: "Clientes",
    href: "/clients",
    icon: Users,
    accent: "border-brand-orange/25 bg-white/[0.04] hover:bg-white/[0.08]",
    iconClass: "text-brand-orange",
  },
  {
    key: "catalog",
    label: "Catálogo",
    href: "/catalog/deliverables",
    icon: ListChecks,
    accent: "border-white/14 bg-white/[0.04] hover:bg-white/[0.08]",
    iconClass: "text-muted-foreground",
  },
  {
    key: "finance",
    label: "Caixa",
    href: "/finance",
    icon: Wallet,
    accent: "border-brand-yellow/35 bg-brand-yellow/10 hover:bg-brand-yellow/18",
    iconClass: "text-brand-yellow",
  },
] as const;

function ActionTile({
  label,
  icon: Icon,
  accent,
  iconClass,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconClass: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition",
        accent,
      )}
    >
      <Icon className={cn("size-4 shrink-0", iconClass)} />
      <span className="text-[11px] font-medium leading-tight text-foreground">
        {label}
      </span>
    </div>
  );
}

export function DashboardQuickActions({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Atalhos principais"
      className={cn(
        "grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-[640px] lg:grid-cols-4 xl:grid-cols-7",
        className,
      )}
    >
      {actions.map((item) => {
        if (item.key === "quick") {
          return (
            <div key={item.key} className="relative">
              <QuickProjectDialog
                triggerClassName={cn(
                  "flex min-h-[72px] w-full flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition",
                  item.accent,
                )}
                triggerLabel={
                  <>
                    <Zap className={cn("size-4 shrink-0", item.iconClass)} />
                    <span className="text-[11px] font-medium leading-tight">
                      {item.label}
                    </span>
                  </>
                }
              />
            </div>
          );
        }

        if (!("href" in item) || !item.href) return null;

        return (
          <Link key={item.key} href={item.href} className="block">
            <ActionTile
              label={item.label}
              icon={item.icon}
              accent={item.accent}
              iconClass={item.iconClass}
            />
          </Link>
        );
      })}
    </nav>
  );
}
