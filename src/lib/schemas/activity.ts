import { z } from "zod";

export const activityPhaseEnum = z.enum([
  "planning",
  "production",
  "review",
  "delivery",
  "other",
]);

export const activityKindEnum = z.enum(["activity", "milestone"]);

export const activityStatusEnum = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "delayed",
]);

const dateRequired = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD).");

export const ActivitySchema = z.object({
  name: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres").max(160),
  description: z.string().max(2000).optional(),
  phase: activityPhaseEnum,
  kind: activityKindEnum,
  status: activityStatusEnum,
  estimated_duration_days: z
    .number()
    .int()
    .min(0, "Duração mínima é 0."),
  planned_start_date: dateRequired,
  planned_end_date: dateRequired,
  visible_to_client: z.boolean(),
  predecessor_ids: z.array(z.string().uuid()).optional(),
});

export type ActivityFormValues = z.infer<typeof ActivitySchema>;
