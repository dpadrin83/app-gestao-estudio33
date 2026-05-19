import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { formatCurrency, formatDateShort, paymentStatusLabels } from "@/lib/format";
import type { ProjectWithClient } from "@/types/database";

export function ClientProjectsList({ projects }: { projects: ProjectWithClient[] }) {
  if (projects.length === 0) {
    return (
      <Card className="mb-8 p-6 text-center text-sm text-muted-foreground">
        Nenhum projeto vinculado a este cliente ainda.
      </Card>
    );
  }

  return (
    <Card className="mb-8 overflow-hidden">
      <ul className="divide-y divide-border">
        {projects.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                {p.name}
              </Link>
              <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {p.start_date && (
                  <span>Início {formatDateShort(p.start_date)}</span>
                )}
                {p.expected_end_date && (
                  <span>· Prazo {formatDateShort(p.expected_end_date)}</span>
                )}
                {p.contract_value != null && (
                  <span>· {formatCurrency(p.contract_value)}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={p.status} />
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {paymentStatusLabels[p.payment_status]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
