import { z } from "zod";

export const clientServiceKindEnum = z.enum([
  "domain_br",
  "domain",
  "hosting",
  "email",
  "ssl",
  "cdn",
  "other",
]);

export const clientServiceBillingCycleEnum = z.enum([
  "monthly",
  "yearly",
  "other",
]);

export const ClientServiceSchema = z.object({
  kind: clientServiceKindEnum,
  name: z.string().min(2, "Informe o nome (ex.: dominio.com.br).").max(200),
  provider: z.string().max(120).optional().or(z.literal("")),
  next_due_date: z
    .string()
    .min(1, "Informe a data de vencimento.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida."),
  billing_cycle: clientServiceBillingCycleEnum,
  amount: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[\d.,]+$/.test(v.replace(/\s/g, "")),
      "Valor inválido.",
    ),
  panel_url: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "URL do painel deve começar com http:// ou https://",
    ),
  notes: z.string().max(2000).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export type ClientServiceFormValues = z.infer<typeof ClientServiceSchema>;

export function parseClientServiceAmount(
  raw: string | undefined,
): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
