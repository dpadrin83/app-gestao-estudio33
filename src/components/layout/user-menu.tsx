"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu({ email }: { email: string }) {
  const initials = email
    .split("@")[0]
    ?.split(/[._-]/)
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 pl-1.5 pr-2"
          aria-label="Menu do usuário"
        >
          <span
            className="grad-diag flex size-7 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg,#FFBD00 0%,#FF5400 13%,#FF0054 29%,#C52AAF 48%,#5C28DB 67%,#2D79E6 87%)",
            }}
          >
            {initials}
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground" />
          <span className="truncate">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => {
          await fetch("/logout", { method: "POST" });
          window.location.href = "/login";
        }}>
          <LogOut className="size-3.5" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
