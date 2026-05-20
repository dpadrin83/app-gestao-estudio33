import { PageHeader } from "@/components/page-header";
import { DeliverableCatalogManager } from "@/components/catalog/deliverable-catalog-manager";
import { listDeliverableCatalog } from "@/lib/actions/deliverable-catalog";
import { listStudioProfessionals } from "@/lib/actions/project-macro-plan";

export default async function DeliverableCatalogPage() {
  const [items, professionals] = await Promise.all([
    listDeliverableCatalog({ activeOnly: false }),
    listStudioProfessionals(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Catálogo de entregáveis"
        description="Lista mestra de etapas do estúdio — use nos projetos com um clique."
      />
      <DeliverableCatalogManager items={items} professionals={professionals} />
    </>
  );
}
