import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/forms/client-form";
import { getClient } from "@/lib/actions/clients";
import { formatDate } from "@/lib/format";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) return notFound();

  return (
    <>
      <PageHeader
        eyebrow={`Clientes · ${client.status === "active" ? "ativo" : "inativo"}`}
        title={client.name}
        description={`Cadastrado em ${formatDate(client.created_at)}.`}
      />
      <ClientForm initial={client} />
    </>
  );
}
