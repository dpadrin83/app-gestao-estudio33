import { z } from "zod";
import { deliverableTypeEnum } from "@/lib/schemas/deliverable";

export const serviceLineCatalogEnum = z.enum([
  "branding",
  "identity",
  "content",
  "web_design",
  "web_dev",
  "hybrid",
]);

export const DeliverableCatalogGroupSchema = z.object({
  name: z.string().min(2, "Informe o nome da área.").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type DeliverableCatalogGroupFormValues = z.infer<
  typeof DeliverableCatalogGroupSchema
>;

export const DeliverableCatalogItemSchema = z.object({
  group_id: z.string().uuid("Selecione a área."),
  name: z.string().min(2, "Informe o nome da etapa.").max(200),
  deliverable_type: deliverableTypeEnum,
  estimated_days: z
    .number({ error: "Informe os dias." })
    .int()
    .min(1, "Mínimo 1 dia."),
  professional_id: z.string().optional().or(z.literal("")),
  predecessor_id: z.string().optional().or(z.literal("")),
  service_line: z.union([serviceLineCatalogEnum, z.literal("")]).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export type DeliverableCatalogItemFormValues = z.infer<
  typeof DeliverableCatalogItemSchema
>;
