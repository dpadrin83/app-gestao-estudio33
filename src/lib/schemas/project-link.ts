import { z } from "zod";

export const projectLinkKindEnum = z.enum([
  "drive",
  "figma",
  "github",
  "doc",
  "link",
  "other",
  "supabase",
  "vercel",
  "cursor",
  "hosting",
  "credential",
]);

export const ProjectLinkSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório.").max(120),
    url: z.string().max(500).optional().or(z.literal("")),
    username: z.string().max(200).optional().or(z.literal("")),
    secret_note: z.string().max(2000).optional().or(z.literal("")),
    kind: projectLinkKindEnum,
  })
  .refine(
    (v) => {
      const url = v.url?.trim() ?? "";
      const secret = v.secret_note?.trim() ?? "";
      return url.length > 0 || secret.length > 0;
    },
    { message: "Informe uma URL ou uma senha/nota de acesso.", path: ["url"] },
  )
  .refine(
    (v) => {
      const url = v.url?.trim() ?? "";
      if (!url) return true;
      return (
        /^https?:\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}/i.test(url)
      );
    },
    { message: "Use uma URL válida.", path: ["url"] },
  );

export type ProjectLinkFormValues = z.infer<typeof ProjectLinkSchema>;
