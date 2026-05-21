import { z } from "zod";
import { serviceLineEnum } from "@/lib/schemas/project";

export const QuickProjectSchema = z.object({
  name: z.string().min(2, "Informe o nome do projeto.").max(160),
  service_line: z.union([serviceLineEnum, z.literal("")]).optional(),
  setup_digital_schedule: z.boolean().optional(),
});

export type QuickProjectFormValues = z.infer<typeof QuickProjectSchema>;
