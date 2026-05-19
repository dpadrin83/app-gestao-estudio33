import { z } from "zod";

export const clientStatusEnum = z.enum([
  "prospect",
  "active",
  "paused",
  "closed",
  "inactive",
]);

export const clientCompanySizeEnum = z.enum([
  "micro",
  "small",
  "medium",
  "large",
  "other",
]);

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

function normalizeCnpj(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return undefined;
  if (digits.length !== 14) {
    return value.trim();
  }
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export const ClientSchema = z.object({
  name: z
    .string()
    .min(2, "Nome da empresa precisa ter pelo menos 2 caracteres.")
    .max(160),
  legal_name: optionalText(200),
  cnpj: optionalText(20).refine(
    (v) => !v || v.replace(/\D/g, "").length === 0 || v.replace(/\D/g, "").length === 14,
    "CNPJ deve ter 14 dígitos (ou deixe em branco).",
  ),
  segment: optionalText(120),
  company_size: z
    .union([clientCompanySizeEnum, z.literal("__none__")])
    .optional(),
  website: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v) || /^[\w.-]+\.[a-z]{2,}/i.test(v),
      "Use uma URL válida (ex.: https://empresa.com.br).",
    ),
  logo_url: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "URL do logo deve começar com http:// ou https://",
    ),
  portal_background_url: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "URL do fundo deve começar com http:// ou https://",
    ),
  contact_name: optionalText(120),
  contact_role: optionalText(80),
  email: z
    .string()
    .email("E-mail inválido.")
    .max(160)
    .optional()
    .or(z.literal("")),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  notes: optionalText(4000),
  status: clientStatusEnum,
  auth_user_id: z
    .string()
    .uuid("UUID inválido do usuário Supabase.")
    .optional()
    .or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;

export function normalizeClientForm(values: ClientFormValues) {
  const website = values.website?.trim();
  return {
    name: values.name.trim(),
    legal_name: values.legal_name?.trim() || null,
    cnpj: normalizeCnpj(values.cnpj) ?? null,
    segment: values.segment?.trim() || null,
    company_size:
      values.company_size && values.company_size !== "__none__"
        ? values.company_size
        : null,
    website:
      website && !/^https?:\/\//i.test(website) ? `https://${website}` : website || null,
    logo_url: values.logo_url?.trim() || null,
    portal_background_url: values.portal_background_url?.trim() || null,
    contact_name: values.contact_name?.trim() || null,
    contact_role: values.contact_role?.trim() || null,
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    whatsapp: values.whatsapp?.trim() || null,
    notes: values.notes?.trim() || null,
    status: values.status,
    auth_user_id:
      values.auth_user_id && values.auth_user_id !== ""
        ? values.auth_user_id
        : null,
  };
}
