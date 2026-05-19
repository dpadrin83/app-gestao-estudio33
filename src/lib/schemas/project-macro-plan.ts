import { z } from "zod";

export const MacroAreaSchema = z.object({
  name: z.string().min(1, "Informe o nome da área macro."),
  professional_id: z.string().optional(),
});

export const WorkItemSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  item_type: z.enum(["sub_etapa", "entregavel"]),
  professional_id: z.string().min(1, "Selecione a área profissional."),
  estimated_days: z
    .number({ error: "Informe os dias." })
    .int()
    .min(0, "Dias inválidos."),
  macro_area_id: z.string().optional(),
});

export type MacroAreaFormValues = z.infer<typeof MacroAreaSchema>;
export type WorkItemFormValues = z.infer<typeof WorkItemSchema>;
