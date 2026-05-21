"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setProjectPaymentStatus } from "@/lib/actions/finance";
import { paymentStatusLabels } from "@/lib/format";
import type { PaymentStatus } from "@/types/database";

export function FinanceRowPayment({
  projectId,
  status,
}: {
  projectId: string;
  status: PaymentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      const result = await setProjectPaymentStatus(
        projectId,
        value as PaymentStatus,
      );
      if (result.ok) {
        toast.success(`Pagamento: ${paymentStatusLabels[value as PaymentStatus]}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 w-[130px] font-mono text-[10px] uppercase">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(paymentStatusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
