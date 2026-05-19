import Link from "next/link";
import { listClients, type ClientListFilter } from "@/lib/actions/clients";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientFilters } from "./client-filters";
import { ClientStatusActions } from "./client-status-actions";
import { ClientStatusBadge } from "@/components/client-status-badge";
import { clientCompanySizeLabels, formatDateShort } from "@/lib/format";

const VALID_FILTERS: ClientListFilter[] = [
  "operational",
  "prospect",
  "active",
  "paused",
  "closed",
  "inactive",
  "all",
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const rawStatus = params.status ?? "operational";
  const status = (
    VALID_FILTERS.includes(rawStatus as ClientListFilter)
      ? rawStatus
      : "operational"
  ) as ClientListFilter;
  const q = params.q ?? "";
  const clients = await listClients({ status, q });

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title="Clientes"
        description="Empresa + contato principal. Arquivar esconde da lista de novos projetos."
        action={
          <Link href="/clients/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Novo cliente
          </Link>
        }
      />

      <ClientFilters initialStatus={status} initialQ={q} />

      <Card className="overflow-hidden">
        {clients.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Nada por aqui
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {q
                ? `Nenhum cliente encontrado para "${q}".`
                : "Ajuste o filtro ou cadastre um cliente novo."}
            </p>
            {!q && status !== "inactive" && (
              <Link href="/clients/new" className={cn(buttonVariants(), "mt-4 inline-flex")}>
                <Plus className="size-4" />
                Criar cliente
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Comunicação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.legal_name && c.legal_name !== c.name && (
                        <p className="text-xs text-muted-foreground">{c.legal_name}</p>
                      )}
                      {(c.segment || c.cnpj) && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {[c.segment, c.cnpj].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.contact_name ? (
                        <>
                          <p>{c.contact_name}</p>
                          {c.contact_role && (
                            <p className="text-xs text-muted-foreground">
                              {c.contact_role}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <p>{c.email ?? "—"}</p>
                      <p className="font-mono">
                        {c.whatsapp ?? c.phone ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={c.status} />
                      {c.company_size && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {clientCompanySizeLabels[c.company_size]}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateShort(c.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/clients/${c.id}`}
                          aria-label={`Editar ${c.name}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <ClientStatusActions id={c.id} status={c.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
