import { z } from "zod";

export const projectLinkKindEnum = z.enum([
  "drive",
  "figma",
  "github",
  "doc",
  "link",
  "other",
]);

export const ProjectLinkSchema = z.object({
  name: z.string().min(1, "Nome obrigatório.").max(120),
  url: z
    .string()
    .min(4, "URL obrigatória.")
    .max(500)
    .refine(
      (v) => /^https?:\/\//i.test(v) || /^[\w.-]+\.[a-z]{2,}/i.test(v),
      "Use uma URL válida.",
    ),
  kind: projectLinkKindEnum,
});

export type ProjectLinkFormValues = z.infer<typeof ProjectLinkSchema>;
