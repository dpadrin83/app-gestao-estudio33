import { z } from "zod";

export const clientAccessKindEnum = z.enum([
  "instagram",
  "registro_br",
  "domain_br",
  "domain",
  "hosting",
  "email",
  "ssl",
  "cdn",
  "other",
]);

export const clientAccessBillingCycleEnum = z.enum([
  "monthly",
  "yearly",
  "other",
]);

/** Tipos com renovação (vencimento e valor costumam ser obrigatórios). */
export const RENEWAL_ACCESS_KINDS = [
  "domain_br",
  "domain",
  "hosting",
  "email",
  "ssl",
  "cdn",
  "registro_br",
] as const;

export function isRenewalAccessKind(
  kind: z.infer<typeof clientAccessKindEnum>,
): boolean {
  return (RENEWAL_ACCESS_KINDS as readonly string[]).includes(kind);
}

export const ClientAccessSchema = z
  .object({
    kind: clientAccessKindEnum,
    label: z
      .string()
      .min(2, "Informe um nome para identificar o acesso.")
      .max(200),
    username: z.string().min(1, "Informe o login.").max(200),
    password: z.string().max(500).optional().or(z.literal("")),
    login_url: z
      .string()
      .max(500)
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || /^https?:\/\//i.test(v),
        "URL deve começar com http:// ou https://",
      ),
    next_due_date: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || !Number.isNaN(Date.parse(v)),
        "Data de vencimento inválida.",
      ),
    provider: z.string().max(120).optional().or(z.literal("")),
    billing_cycle: clientAccessBillingCycleEnum.optional(),
    amount: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || /^[\d.,]+$/.test(v.replace(/\s/g, "")),
        "Valor inválido.",
      ),
    notes: z.string().max(2000).optional().or(z.literal("")),
    is_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (isRenewalAccessKind(data.kind) && !data.next_due_date?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a data de vencimento.",
        path: ["next_due_date"],
      });
    }
  });

export type ClientAccessFormValues = z.infer<typeof ClientAccessSchema>;

export function parseClientAccessAmount(
  raw: string | undefined,
): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
