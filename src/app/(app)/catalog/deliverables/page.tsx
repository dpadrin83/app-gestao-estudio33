import { PageHeader } from "@/components/page-header";
import { DeliverableCatalogManager } from "@/components/catalog/deliverable-catalog-manager";
import { getCatalogStructure } from "@/lib/actions/deliverable-catalog";
import { listStudioProfessionals } from "@/lib/actions/project-macro-plan";

export default async function DeliverableCatalogPage() {
  const [{ groups, ungrouped }, professionals] = await Promise.all([
    getCatalogStructure(),
    listStudioProfessionals(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Catálogo de entregáveis"
        description="Áreas e etapas reutilizáveis — importe no projeto do cliente."
      />
      <DeliverableCatalogManager
        groups={groups}
        ungrouped={ungrouped}
        professionals={professionals}
      />
    </>
  );
}
