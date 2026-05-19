import { getClientInitials } from "@/lib/portal/client-brand";
import { cn } from "@/lib/utils";

export function PortalClientBrand({
  name,
  logoUrl,
  segment,
  size = "lg",
  className,
}: {
  name: string;
  logoUrl: string | null;
  segment: string | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  const initials = getClientInitials(name);
  const box = size === "lg" ? "size-16 text-lg" : "size-10 text-sm";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card font-semibold text-brand-orange",
          box,
        )}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="size-full object-contain p-2"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold tracking-tight",
            size === "lg" ? "text-2xl" : "text-sm",
          )}
        >
          {name}
        </p>
        {segment && (
          <p className="mt-0.5 text-sm text-muted-foreground">{segment}</p>
        )}
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-brand-orange">
          Projetos com o Estúdio 33
        </p>
      </div>
    </div>
  );
}
