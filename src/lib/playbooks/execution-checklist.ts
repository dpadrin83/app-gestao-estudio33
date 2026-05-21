/**
 * Checklists de execução (micro-passos) por nome de etapa.
 * Não altera ordem nem dependências do catálogo — só orienta o dia a dia.
 */

import type { ExecutionChecklistItem } from "@/types/database";

export type { ExecutionChecklistItem };

export function newChecklistItem(label: string): ExecutionChecklistItem {
  return { id: crypto.randomUUID(), label, done: false };
}

function norm(name: string): string {
  return name.trim().toLowerCase();
}

/** Rótulos sugeridos por etapa (chave = nome da etapa em minúsculas). */
const PLAYBOOK_BY_STEP: Record<string, string[]> = {
  "registro de domínio e dns": [
    "Domínio registrado ou confirmado com o cliente",
    "DNS apontado (A/CNAME conforme hospedagem)",
    "Salvar painel Registro.br em Acessos do projeto",
  ],
  "hospedagem e contas (contratação)": [
    "Conta de hospedagem criada (Vercel ou equivalente)",
    "E-mail de convite / proprietário definido",
    "Salvar URL do painel em Acessos do projeto",
  ],
  "briefing digital e requisitos": [
    "Escopo site/app alinhado ao PRD ou briefing Studio",
    "Links de referência na aba Acessos",
  ],
  "prd digital": [
    "PRD revisado com requisitos e fora de escopo",
    "Prompt de PRD rodado no Cursor (se aplicável)",
    "Arquivo ou link do PRD em Acessos",
  ],
  "sitemap e arquitetura de informação": [
    "Mapa de páginas aprovado internamente",
    "Fluxos principais desenhados",
  ],
  "wireframes (fluxos e telas-chave)": [
    "Fluxos críticos em baixa fidelidade",
    "Sem envio de WIP ao cliente",
  ],
  "ui e protótipo figma": [
    "Telas-chave em alta fidelidade",
    "Componentes e tokens básicos",
    "Link Figma em Acessos do projeto",
  ],
  "protótipo html de teste": [
    "HTML navegável alinhado ao Figma",
    "Pronto para pacote de aprovação (não rascunho)",
  ],
  "aprovação do cliente — design digital final": [
    "Figma + HTML final enviados no portal",
    "Feedback registrado ou aprovação formal",
  ],
  "handoff design → desenvolvimento": [
    "Assets exportados (ícones, imagens)",
    "Tokens/cores/tipografia documentados",
    "PRD e links reunidos em Acessos",
  ],
  "configuração github (repositório)": [
    "Repositório criado (privado se necessário)",
    "README e .gitignore",
    "URL do repo salva em Acessos → GitHub",
  ],
  "configuração supabase (projeto e base)": [
    "Projeto criado no dashboard Supabase",
    "URL, anon key e service role em Acessos → Supabase",
    "Senha do banco anotada em Acessos (se aplicável)",
  ],
  "configuração vercel (deploy e domínio)": [
    "Projeto Vercel vinculado ao repositório",
    "Variáveis de ambiente iniciais (Supabase) na Vercel",
    "URL do painel Vercel em Acessos",
  ],
  "preparação do ambiente de desenvolvimento": [
    "Repositório clonado na pasta local do projeto",
    "`.env.local` com variáveis do Supabase",
    "`npm install` e `npm run dev` sem erro",
    "Não abrir Cursor para código antes dos itens acima",
  ],
  "implementação (site, app ou sistema)": [
    "GitHub, Supabase e Vercel já cadastrados em Acessos",
    "Pasta local + `.env.local` validados",
    "Schema/migrations aplicados no Supabase",
    "Só agora: Cursor — prompt de contexto (planejamento + PRD + handoff)",
    "Implementar telas conforme Figma/HTML aprovado",
    "Commits incrementais no GitHub",
  ],
  "cms, apis e integrações": [
    "Painéis e formulários testados",
    "Integrações documentadas em Acessos",
  ],
  "ssl, performance e seo técnico": [
    "HTTPS e redirects OK",
    "Lighthouse / performance revisados",
  ],
  "homologação do cliente (staging)": [
    "URL de staging em Acessos",
    "Testes internos concluídos antes do envio",
    "Cliente validou em staging",
  ],
  "deploy e go-live": [
    "Deploy produção após OK em homologação",
    "Domínio produção apontando corretamente",
  ],
  "entrega e treinamento ao cliente": [
    "Acessos finais entregues (sem senhas no portal)",
    "Manual ou vídeo de uso, se combinado",
  ],
};

export function getSuggestedChecklistLabels(stepName: string): string[] {
  return PLAYBOOK_BY_STEP[norm(stepName)] ?? [];
}

export function buildDefaultChecklist(stepName: string): ExecutionChecklistItem[] {
  return getSuggestedChecklistLabels(stepName).map((label) =>
    newChecklistItem(label),
  );
}

export function parseExecutionChecklist(raw: unknown): ExecutionChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is ExecutionChecklistItem =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as ExecutionChecklistItem).id === "string" &&
        typeof (x as ExecutionChecklistItem).label === "string" &&
        typeof (x as ExecutionChecklistItem).done === "boolean",
    )
    .map((x) => ({ id: x.id, label: x.label, done: x.done }));
}
