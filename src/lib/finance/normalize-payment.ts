import { format } from "date-fns";
import type { ProjectFinancePaymentFormValues } from "@/lib/schemas/project-finance-payment";

function emptyToNullDate(v: string | undefined): string | null {
  return v && v !== "" ? v : null;
}

/** Campos financeiros do projeto (contrato + pagamento + datas). */
export function normalizeFinancePayment(values: ProjectFinancePaymentFormValues) {
  const cv = values.contract_value;
  const today = format(new Date(), "yyyy-MM-dd");
  let invoiced_at = emptyToNullDate(values.invoiced_at);
  let received_at = emptyToNullDate(values.received_at);

  if (values.payment_status === "invoiced" && !invoiced_at) {
    invoiced_at = today;
  }
  if (values.payment_status === "received") {
    if (!invoiced_at) invoiced_at = today;
    if (!received_at) received_at = today;
  }

  return {
    contract_value:
      !cv || cv === "" ? null : Number(String(cv).replace(",", ".")),
    payment_status: values.payment_status,
    invoiced_at,
    received_at,
  };
}
