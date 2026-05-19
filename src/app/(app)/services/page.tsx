import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAllClientServices } from "@/lib/actions/client-services";
import {
  getServiceDueStatus,
  serviceDueLabel,
} from "@/lib/client-services/due-status";
import {
  clientServiceBillingCycleLabels,
  clientServiceKindLabels,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ServicesPage() {
  const services = await listAllClientServices();

  const overdue = services.filter(
    (s) => getServiceDueStatus(s.next_due_date, s.is_active).status === "overdue",
  );
  const soon = services.filter(
    (s) => getServiceDueStatus(s.next_due_date, s.is_active).status === "soon",
  );

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Domínios e hospedagem"
        description="Vencimentos de registro .br, hospedagem, e-mail e SSL — por cliente, ordenados pela data mais próxima."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Ativos
          </p>
          <p className="mt-2 font-mono text-2xl font-bold">{services.length}</p>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">
            Vencidos
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-destructive">
            {overdue.length}
          </p>
        </Card>
        <Card className="border-brand-yellow/30 bg-brand-yellow/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#FDBA74]">
            Vence em 30 dias
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#FDBA74]">
            {soon.length}
          </p>
        </Card>
      </div>

      {services.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado. Abra um{" "}
          <Link href="/clients" className="text-brand-orange hover:underline">
            cliente
          </Link>{" "}
          e use a seção Domínios e hospedagem.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => {
                const { status, daysUntil } = getServiceDueStatus(
                  s.next_due_date,
                  s.is_active,
                );
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${s.client_id}`}
                        className="font-medium hover:text-brand-orange hover:underline"
                      >
                        {s.client?.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] uppercase text-muted-foreground">
                      {clientServiceKindLabels[s.kind]}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.provider ?? "—"}
                    </TableCell>
                    <TableCell>
                      {formatDate(s.next_due_date)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({clientServiceBillingCycleLabels[s.billing_cycle]})
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(s.amount)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase",
                          status === "overdue" &&
                            "border-destructive/40 bg-destructive/10 text-destructive",
                          status === "soon" &&
                            "border-brand-yellow/40 bg-brand-yellow/10 text-[#FDBA74]",
                          status === "ok" &&
                            "border-success/30 bg-success/10 text-success",
                        )}
                      >
                        {serviceDueLabel(daysUntil, status)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
