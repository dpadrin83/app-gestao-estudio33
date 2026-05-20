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
import { listAllClientAccess } from "@/lib/actions/client-access";
import {
  getServiceDueStatus,
  serviceDueLabel,
} from "@/lib/client-services/due-status";
import {
  clientAccessBillingCycleLabels,
  clientAccessKindLabels,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ServicesPage() {
  const access = await listAllClientAccess();

  const overdue = access.filter(
    (a) =>
      a.next_due_date &&
      getServiceDueStatus(a.next_due_date, a.is_active).status === "overdue",
  );
  const soon = access.filter(
    (a) =>
      a.next_due_date &&
      getServiceDueStatus(a.next_due_date, a.is_active).status === "soon",
  );

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Acessos e vencimentos"
        description="Domínios, hospedagem, Registro.br e outros com data de renovação — por cliente."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Com vencimento
          </p>
          <p className="mt-2 font-mono text-2xl font-bold">{access.length}</p>
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

      {access.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhum acesso com vencimento cadastrado. Abra um{" "}
          <Link href="/clients" className="text-brand-orange hover:underline">
            cliente
          </Link>{" "}
          e use a seção Acessos do cliente.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Identificação</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {access.map((a) => {
                const { status, daysUntil } = getServiceDueStatus(
                  a.next_due_date!,
                  a.is_active,
                );
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${a.client_id}`}
                        className="font-medium hover:text-brand-orange hover:underline"
                      >
                        {a.client?.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] uppercase text-muted-foreground">
                      {clientAccessKindLabels[a.kind]}
                    </TableCell>
                    <TableCell className="font-medium">{a.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.provider ?? "—"}
                    </TableCell>
                    <TableCell>
                      {formatDate(a.next_due_date!)}
                      {a.billing_cycle && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({clientAccessBillingCycleLabels[a.billing_cycle]})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(a.amount)}</TableCell>
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
