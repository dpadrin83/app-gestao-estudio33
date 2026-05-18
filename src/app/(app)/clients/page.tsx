import Link from "next/link";
import { listClients } from "@/lib/actions/clients";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientFilters } from "./client-filters";
import { ClientStatusActions } from "./client-status-actions";
import { formatDateShort } from "@/lib/format";
import type { ClientStatus } from "@/types/database";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? "active") as ClientStatus | "all";
  const q = params.q ?? "";
  const clients = await listClients({ status, q });

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title="Clientes"
        description="Cadastro com histórico — não é CRM de funil. Inativar não apaga, só esconde da lista."
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
                : status === "inactive"
                  ? "Você não tem clientes inativos."
                  : "Cadastre o primeiro cliente para começar."}
            </p>
            {!q && status !== "inactive" && (
              <Link href="/clients/new" className={cn(buttonVariants(), "mt-4 inline-flex")}>
                <Plus className="size-4" />
                Criar cliente
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastrado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/clients/${c.id}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.email ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    {c.status === "active" ? (
                      <Badge variant="secondary" className="border border-success/40 bg-success/15 text-[#86EFAC]">
                        ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        inativo
                      </Badge>
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
        )}
      </Card>
    </>
  );
}
