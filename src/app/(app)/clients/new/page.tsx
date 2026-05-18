import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/forms/client-form";

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clientes · Novo"
        title="Cadastrar cliente"
        description="Dados mínimos para começar. Você pode editar tudo depois."
      />
      <ClientForm />
    </>
  );
}
