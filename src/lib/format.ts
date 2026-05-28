/**
 * Helpers de formatação — Hub Estúdio 33
 * Tudo em PT-BR.
 */
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata duração em milissegundos para "2h 35min" (não decimal).
 * Aceita também segundos pra zero.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0min";
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Duração entre duas datas ISO (ou Date). Se ended for null/undefined,
 * usa "agora" (útil pra sessão rodando).
 */
export function durationBetween(
  started: string | Date,
  ended: string | Date | null | undefined,
): number {
  const a = new Date(started).getTime();
  const b = ended ? new Date(ended).getTime() : Date.now();
  return Math.max(0, b - a);
}

/* ─── datas ─── */

export function formatDate(date: string | Date, fmt = "dd MMM yyyy"): string {
  return format(new Date(date), fmt, { locale: ptBR });
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "dd MMM", { locale: ptBR });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy · HH:mm", { locale: ptBR });
}

/* ─── moeda ─── */

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* ─── status humanizados ─── */

export const projectStatusLabels = {
  in_progress: "em produção",
  paused: "pausado",
  done: "concluído",
  archived: "arquivado",
} as const;

export const clientStatusLabels = {
  prospect: "prospecto",
  active: "ativo",
  paused: "em pausa",
  closed: "encerrado",
  inactive: "arquivado",
} as const;

export const clientCompanySizeLabels = {
  micro: "micro",
  small: "pequeno",
  medium: "médio",
  large: "grande",
  other: "outro",
} as const;

export const activityPhaseLabels = {
  planning: "planejamento",
  production: "produção",
  review: "revisão",
  delivery: "entrega",
  other: "outro",
} as const;

export const activityStatusLabels = {
  not_started: "não iniciada",
  in_progress: "em andamento",
  completed: "concluída",
  delayed: "atrasada",
} as const;

export const deliverableStatusLabels = {
  draft: "rascunho",
  internal_review: "revisão interna",
  sent_to_client: "aguardando cliente",
  approved: "aprovado",
  rejected: "reprovado",
} as const;

export const deliverableTypeLabels = {
  video: "vídeo",
  design: "arte",
  doc: "documento",
  code: "código",
  link: "link",
} as const;

export const paymentStatusLabels = {
  to_invoice: "a faturar",
  invoiced: "faturado",
  received: "recebido",
} as const;

export const studioCashCategoryLabels = {
  operational: "Operacional",
  software: "Software / assinatura",
  tax: "Impostos",
  marketing: "Marketing",
  equipment: "Equipamento",
  card: "Cartão",
  payroll: "Folha / freela",
  owner_draw: "Pró-labore / retirada",
  other: "Outro",
} as const;

export const financeDocumentKindLabels = {
  contract: "Contrato",
  invoice: "Nota fiscal / NF",
  receipt: "Comprovante",
  other: "Outro",
} as const;

export const serviceLineLabels = {
  branding: "Branding / estratégia",
  identity: "Identidade visual",
  content: "Produção de conteúdo",
  web_design: "Soluções digitais — design",
  web_dev: "Soluções digitais — DEV",
  hybrid: "Projeto híbrido",
  consulting: "Consultoria",
} as const;

export const projectLinkKindLabels = {
  drive: "Google Drive",
  figma: "Figma",
  github: "GitHub",
  doc: "Documento",
  link: "Link",
  other: "Outro",
  supabase: "Supabase",
  vercel: "Vercel",
  cursor: "Cursor / IDE",
  hosting: "Hospedagem",
  credential: "Credencial / senha",
} as const;

export const clientAccessBillingCycleLabels = {
  monthly: "mensal",
  yearly: "anual",
  other: "outro",
} as const;

/** @deprecated Use clientAccessBillingCycleLabels */
export const clientServiceBillingCycleLabels = clientAccessBillingCycleLabels;

export const clientAccessKindLabels = {
  instagram: "Instagram",
  registro_br: "Registro.br",
  domain_br: "Domínio .br",
  domain: "Domínio",
  hosting: "Hospedagem",
  email: "E-mail profissional",
  ssl: "SSL / certificado",
  cdn: "CDN",
  other: "Outro",
} as const;

/** @deprecated Use clientAccessKindLabels */
export const clientServiceKindLabels = clientAccessKindLabels;

export const taskStatusLabels = {
  todo: "a fazer",
  doing: "fazendo",
  done: "feito",
} as const;

export const workItemTypeLabels = {
  sub_etapa: "sub-etapa",
  entregavel: "entregável",
} as const;
