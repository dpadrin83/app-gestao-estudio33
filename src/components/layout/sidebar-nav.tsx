"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dot: string;
};

const items: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, dot: "bg-[#E8E8E8]" },
  { href: "/clients",   label: "Clientes",  icon: Users,           dot: "bg-brand-orange" },
  { href: "/projects",  label: "Projetos",  icon: FolderKanban,    dot: "bg-brand-purple" },
];

export function SidebarNav({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="flex gap-2 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span className={cn("h-2 w-2 rounded-sm", item.dot)} />
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="sticky top-[59px] flex h-[calc(100vh-59px)] flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {active && (
              <span
                className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-sm grad-bg"
                style={{
                  background:
                    "linear-gradient(180deg,#FFBD00 0%,#FF5400 20%,#FF0054 40%,#C52AAF 60%,#5C28DB 80%,#2D79E6 100%)",
                }}
              />
            )}
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-sm",
                item.dot,
                active && "shadow-[0_0_6px_currentColor]",
              )}
            />
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
