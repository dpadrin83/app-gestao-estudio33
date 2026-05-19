import { z } from "zod";

export const taskStatusEnum = z.enum(["todo", "doing", "done"]);

export const TaskSchema = z.object({
  title: z.string().min(1, "Título obrigatório.").max(200),
  description: z.string().max(2000).optional(),
  status: taskStatusEnum,
  activity_id: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof TaskSchema>;
