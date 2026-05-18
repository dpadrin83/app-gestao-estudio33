import { z } from "zod";

export const clientStatusEnum = z.enum(["active", "inactive"]);

export const ClientSchema = z.object({
  name: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres").max(120),
  email: z
    .string()
    .email("E-mail inválido")
    .max(160)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: clientStatusEnum,
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
