import { z } from "zod";

const professionalSlugEnum = z.enum([
  "estrategista-marca",
  "designer-id-visual",
  "designer-aplicacoes",
  "designer-presenca-digital",
  "copywriter",
  "designer-pecas",
  "motion-video",
  "ui-ux-digital",
  "arquiteto-dev",
  "growth-trafego",
  "pm-orquestrador",
]);

export const PromptImportItemSchema = z.object({
  professional_slug: professionalSlugEnum,
  title: z.string().min(1),
  deliverable_hint: z.string().optional().nullable(),
  body: z.string().min(20),
  is_active: z.boolean().optional(),
});

export const PromptImportBundleSchema = z.object({
  prompts: z.array(PromptImportItemSchema).min(1).max(100),
});

export type PromptImportItem = z.infer<typeof PromptImportItemSchema>;
export type PromptImportBundle = z.infer<typeof PromptImportBundleSchema>;
