import { z } from "zod";

export const deliverableTypeEnum = z.enum([
  "video",
  "design",
  "doc",
  "code",
  "link",
]);

export const deliverableStatusEnum = z.enum([
  "draft",
  "internal_review",
  "sent_to_client",
  "approved",
  "rejected",
]);

export const DeliverableSchema = z.object({
  name: z.string().min(2).max(160),
  type: deliverableTypeEnum,
  external_link: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || v === "" || /^https?:\/\/.+/i.test(v),
      "Informe um link válido (https://…)",
    ),
  notes: z.string().max(2000).optional(),
  activity_id: z.string().uuid().optional().or(z.literal("")),
});

export type DeliverableFormValues = z.infer<typeof DeliverableSchema>;

export const DeliverableCommentSchema = z.object({
  body: z.string().min(2, "Escreva um comentário.").max(2000),
});

export type DeliverableCommentFormValues = z.infer<typeof DeliverableCommentSchema>;
