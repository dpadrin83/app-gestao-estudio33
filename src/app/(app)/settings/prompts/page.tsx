import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PromptBank } from "@/components/prompts/prompt-bank";
import { buttonVariants } from "@/components/ui/button";
import { listPromptTemplates } from "@/lib/actions/prompt-templates";
import { listStudioProfessionals } from "@/lib/actions/project-macro-plan";

export default async function PromptsSettingsPage() {
  const [prompts, professionals] = await Promise.all([
    listPromptTemplates({ activeOnly: false }),
    listStudioProfessionals(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Banco de prompts"
        description="Cadastro central de textos para IA — separado do plano por área do projeto."
        action={
          <Link href="/settings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Voltar às configurações
          </Link>
        }
      />
      <PromptBank prompts={prompts} professionals={professionals} />
    </>
  );
}
