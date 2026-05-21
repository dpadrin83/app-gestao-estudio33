import { paymentStatusLabels } from "@/lib/format";
import type { PaymentStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const styles: Record<PaymentStatus, string> = {
  to_invoice: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  invoiced: "border-brand-blue/40 bg-brand-blue/10 text-brand-blue",
  received: "border-success/40 bg-success/10 text-success",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        styles[status],
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}
