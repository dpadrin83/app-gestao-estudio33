import { z } from "zod";
import { paymentStatusEnum } from "@/lib/schemas/project";

const dateOrEmpty = z
  .string()
  .refine(
    (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Data inválida (use AAAA-MM-DD).",
  )
  .optional();

const valueOrEmpty = z
  .string()
  .refine(
    (v) => v === "" || /^\d+([.,]\d{1,2})?$/.test(v),
    "Valor inválido (ex.: 1500.00).",
  )
  .optional();

export const ProjectFinancePaymentSchema = z.object({
  contract_value: valueOrEmpty,
  payment_status: paymentStatusEnum,
  invoiced_at: dateOrEmpty,
  received_at: dateOrEmpty,
});

export type ProjectFinancePaymentFormValues = z.infer<
  typeof ProjectFinancePaymentSchema
>;
