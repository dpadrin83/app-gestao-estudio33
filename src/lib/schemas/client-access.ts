import { z } from "zod";

export const clientAccessKindEnum = z.enum([
  "instagram",
  "registro_br",
  "other",
]);

export const ClientAccessSchema = z.object({
  kind: clientAccessKindEnum,
  label: z
    .string()
    .min(2, "Informe um nome para identificar o acesso.")
    .max(200),
  login_url: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "URL deve começar com http:// ou https://",
    ),
  username: z.string().max(200).optional().or(z.literal("")),
  next_due_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "Data de vencimento inválida.",
    ),
  password: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export type ClientAccessFormValues = z.infer<typeof ClientAccessSchema>;
