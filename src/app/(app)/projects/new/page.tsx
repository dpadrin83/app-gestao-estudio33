import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/forms/project-form";
import { listActiveClients } from "@/lib/actions/projects";
import Link from "next/link";

export default async function NewProjectPage() {
  const clients = await listActiveClients();

  if (clients.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Projetos · Novo"
          title="Cadastrar projeto"
          description="Para criar um projeto, você precisa ter pelo menos um cliente ativo."
        />
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Você ainda não tem clientes ativos cadastrados.
          </p>
          <Link
            href="/clients/new"
            className="mt-3 inline-block text-sm font-semibold underline"
          >
            Cadastrar um cliente →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Projetos · Novo"
        title="Cadastrar projeto"
        description="Vincule a um cliente ativo e defina escopo, prazo e valor."
      />
      <ProjectForm clientOptions={clients} />
    </>
  );
}
