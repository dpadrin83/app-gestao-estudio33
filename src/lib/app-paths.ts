import type { PortfolioGanttSort } from "@/lib/queries/portfolio-gantt";

export function schedulePath(clientId?: string): string {
  if (!clientId) return "/schedule";
  return `/schedule?${new URLSearchParams({ client: clientId }).toString()}`;
}

export function dashboardPath(opts?: {
  clientId?: string;
  sort?: PortfolioGanttSort;
}): string {
  const params = new URLSearchParams();
  if (opts?.clientId) params.set("client", opts.clientId);
  if (opts?.sort && opts.sort !== "days") params.set("sort", opts.sort);
  const q = params.toString();
  return q ? `/dashboard?${q}` : "/dashboard";
}
