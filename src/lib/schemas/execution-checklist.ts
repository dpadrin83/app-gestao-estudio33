import { z } from "zod";

export const ExecutionChecklistItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(500),
  done: z.boolean(),
});

export const ExecutionChecklistSchema = z.array(ExecutionChecklistItemSchema).max(50);
