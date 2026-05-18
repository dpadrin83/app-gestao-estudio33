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
  active: "ativo",
  inactive: "inativo",
} as const;
