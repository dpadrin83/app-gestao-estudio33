import { z } from "zod";
import { deliverableTypeEnum } from "@/lib/schemas/deliverable";

export const DeliverablePlanItemSchema = z.object({
  name: z.string().min(2, "Informe o nome do entregável.").max(200),
  deliverable_type: deliverableTypeEnum,
  estimated_days: z
    .number({ error: "Informe os dias." })
    .int()
    .min(1, "Mínimo 1 dia."),
  professional_id: z.string().optional().or(z.literal("")),
  predecessor_id: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type DeliverablePlanItemFormValues = z.infer<typeof DeliverablePlanItemSchema>;
