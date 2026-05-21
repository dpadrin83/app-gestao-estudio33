import { z } from "zod";

export const studioCashCategoryEnum = z.enum([
  "operational",
  "software",
  "tax",
  "marketing",
  "equipment",
  "card",
  "payroll",
  "owner_draw",
  "other",
]);

export const StudioCashMovementSchema = z.object({
  movement_type: z.enum(["in", "out"]),
  amount: z
    .string()
    .min(1, "Informe o valor.")
    .refine(
      (v) => /^\d+([.,]\d{1,2})?$/.test(v.replace(/\s/g, "")),
      "Valor inválido.",
    ),
  occurred_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  description: z.string().min(2, "Descreva o lançamento.").max(200),
  category: studioCashCategoryEnum,
  project_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  notes: z.string().max(500).optional(),
});

export type StudioCashMovementFormValues = z.infer<
  typeof StudioCashMovementSchema
>;
