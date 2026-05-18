import { z } from "zod";

export const projectStatusEnum = z.enum([
  "in_progress",
  "paused",
  "done",
  "archived",
]);

const dateOrEmpty = z
  .string()
  .refine(
    (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Data inválida (use AAAA-MM-DD).",
  )
  .optional();

const valueOrEmpty = z
  .string()
  .refine(
    (v) => v === "" || /^\d+([.,]\d{1,2})?$/.test(v),
    "Valor inválido (ex.: 1500.00).",
  )
  .optional();

export const ProjectSchema = z.object({
  client_id: z.string().uuid({ message: "Selecione um cliente." }),
  name: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres").max(160),
  description: z.string().max(4000).optional(),
  status: projectStatusEnum,
  start_date: dateOrEmpty,
  expected_end_date: dateOrEmpty,
  contract_value: valueOrEmpty,
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;
