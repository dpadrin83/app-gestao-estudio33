import { z } from "zod";

const dateRequired = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const ProjectCostSchema = z.object({
  description: z.string().min(2).max(200),
  amount: z
    .string()
    .refine((v) => /^\d+([.,]\d{1,2})?$/.test(v), "Valor inválido."),
  incurred_at: dateRequired,
});

export type ProjectCostFormValues = z.infer<typeof ProjectCostSchema>;
