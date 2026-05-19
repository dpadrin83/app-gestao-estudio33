import { z } from "zod";

export const PromptTemplateSchema = z.object({
  title: z.string().min(1, "Informe um título."),
  professional_id: z.string().min(1, "Selecione o profissional."),
  deliverable_hint: z.string().optional(),
  body: z.string().min(20, "O prompt precisa de pelo menos 20 caracteres."),
  is_active: z.boolean().optional(),
});

export type PromptTemplateFormValues = z.infer<typeof PromptTemplateSchema>;
