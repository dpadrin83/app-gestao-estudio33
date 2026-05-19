import "server-only";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpcomingRenewal = {
  id: string;
  name: string;
  kind: string;
  nextDueDate: string;
  daysUntil: number;
  clientId: string;
  clientName: string;
  amount: number | null;
  currency: string;
};

export async function listUpcomingRenewals(
  withinDays = 45,
): Promise<UpcomingRenewal[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const until = format(addDays(today, withinDays), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("client_services")
    .select(
      "id, name, kind, next_due_date, amount, currency, client:clients(id, name)",
    )
    .eq("is_active", true)
    .gte("next_due_date", todayStr)
    .lte("next_due_date", until)
    .order("next_due_date", { ascending: true })
    .limit(12);

  if (error) {
    console.error("[listUpcomingRenewals]", error);
    return [];
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (data ?? []).map((row) => {
    const due = new Date(row.next_due_date + "T12:00:00");
    const daysUntil = Math.ceil(
      (due.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const rawClient = row.client as unknown;
    const client = (Array.isArray(rawClient) ? rawClient[0] : rawClient) as
      | { id: string; name: string }
      | null
      | undefined;
    return {
      id: row.id,
      name: row.name,
      kind: row.kind,
      nextDueDate: format(due, "d MMM yyyy", { locale: ptBR }),
      daysUntil,
      clientId: client?.id ?? "",
      clientName: client?.name ?? "—",
      amount: row.amount != null ? Number(row.amount) : null,
      currency: row.currency,
    };
  });
}
