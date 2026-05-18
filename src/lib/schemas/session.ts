import { z } from "zod";

export const TimeSessionEditSchema = z.object({
  started_at: z.string().min(1, "Início é obrigatório"),
  ended_at: z.string().optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type TimeSessionEditValues = z.infer<typeof TimeSessionEditSchema>;
