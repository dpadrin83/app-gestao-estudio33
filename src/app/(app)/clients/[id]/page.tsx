import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/forms/client-form";
import { ClientStatusBadge } from "@/components/client-status-badge";
import { Card } from "@/components/ui/card";
import { getClient } from "@/lib/actions/clients";
import { listClientAccess } from "@/lib/actions/client-access";
import { listProjectsByClient } from "@/lib/actions/projects";
import { ClientAccessPanel } from "@/components/clients/client-access-panel";
import { PortalAccessPanel } from "@/components/clients/portal-access-panel";
import { ClientProjectsList } from "../client-projects-list";
import {
  clientCompanySizeLabels,
  clientStatusLabels,
  formatDate,
} from "@/lib/format";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) return notFound();

  const [projects, access] = await Promise.all([
    listProjectsByClient(id),
    listClientAccess(id),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title={client.name}
        description={`Cadastrado em ${formatDate(client.created_at)} · ${clientStatusLabels[client.status]}.`}
        action={<ClientStatusBadge status={client.status} />}
      />

      <Card className="mb-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Contato" value={client.contact_name} sub={client.contact_role} />
        <SummaryItem
          label="E-mail"
          value={client.email}
          href={client.email ? `mailto:${client.email}` : undefined}
        />
        <SummaryItem label="WhatsApp / tel." value={client.whatsapp ?? client.phone} />
        <SummaryItem
          label="CNPJ"
          value={client.cnpj}
          sub={
            client.company_size
              ? clientCompanySizeLabels[client.company_size]
              : client.segment ?? undefined
          }
        />
      </Card>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Projetos deste cliente</h2>
      <ClientProjectsList projects={projects} />

      <h2 className="mb-6 mt-10 text-xl font-semibold tracking-tight">
        Acessos do cliente
      </h2>
      <div className="mb-10">
        <ClientAccessPanel clientId={id} access={access} />
      </div>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Portal do cliente</h2>
      <div className="mb-10">
        <PortalAccessPanel client={client} />
      </div>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Dados do cadastro</h2>
      <ClientForm initial={client} />
    </>
  );
}

function SummaryItem({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string | null | undefined;
  sub?: string | null;
  href?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {href && value ? (
        <Link href={href} className="mt-1 block text-sm font-medium hover:underline">
          {value}
        </Link>
      ) : (
        <p className="mt-1 text-sm font-medium">{value ?? "—"}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
