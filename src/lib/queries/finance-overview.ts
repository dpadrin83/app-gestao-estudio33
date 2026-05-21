import "server-only";
import { format, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHourlyRate, type ProjectFinanceSummary } from "@/lib/actions/finance";
import { serviceLineLabels } from "@/lib/format";
import { getMarginAlertPercent } from "@/lib/actions/settings";
import type { PaymentStatus, ServiceLine } from "@/types/database";

export type FinanceOverviewRow = {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  paymentStatus: PaymentStatus;
  serviceLine: ServiceLine | null;
  invoicedAt: string | null;
  receivedAt: string | null;
  budget: number;
  costsTotal: number;
  laborCost: number;
  margin: number;
  marginPercent: number | null;
  marginAtRisk: boolean;
};

export type FinanceReceivablesSummary = {
  toInvoice: number;
  invoicedOpen: number;
  receivedThisMonth: number;
};

export type FinanceTopClient = {
  clientId: string;
  clientName: string;
  projectCount: number;
  revenueReceived: number;
  avgMarginPercent: number | null;
};

export type FinanceServiceLineTicket = {
  serviceLine: ServiceLine;
  label: string;
  projectCount: number;
  avgContract: number;
};

export type FinanceLedgerEntry = {
  id: string;
  date: string;
  type: "credit" | "debit";
  category: "recebimento" | "custo" | "mao_de_obra";
  description: string;
  amount: number;
  projectId: string;
  projectName: string;
};

export type FinanceCashFlowMonth = {
  key: string;
  label: string;
  inflow: number;
  outflow: number;
  net: number;
  isCurrent: boolean;
};

export type FinanceCashFlow = {
  year: number;
  months: FinanceCashFlowMonth[];
  ytdInflow: number;
  ytdOutflow: number;
  ytdNet: number;
  monthInflow: number;
  monthOutflow: number;
  monthNet: number;
};

export type FinancePageData = {
  rows: FinanceOverviewRow[];
  receivables: FinanceReceivablesSummary;
  atRisk: FinanceOverviewRow[];
  topClients: FinanceTopClient[];
  ticketsByLine: FinanceServiceLineTicket[];
  marginAlertPercent: number;
  clients: { id: string; name: string }[];
  cashFlow: FinanceCashFlow;
  ledger: FinanceLedgerEntry[];
};

const MONTH_LABELS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

function addToMonthBucket(
  buckets: number[],
  dateStr: string,
  amount: number,
  year: number,
) {
  const d = parseISO(dateStr);
  if (!isValid(d) || d.getFullYear() !== year) return;
  buckets[d.getMonth()] += amount;
}

function buildCashFlowAndLedger(
  projectList: Array<{
    id: string;
    name: string;
    contract_value: number | null;
    payment_status: PaymentStatus;
    received_at: string | null;
    updated_at: string;
  }>,
  costRows: Array<{
    id: string;
    project_id: string;
    description: string;
    amount: number;
    incurred_at: string;
  }>,
  sessionRows: Array<{
    id: string;
    project_id: string;
    started_at: string;
    ended_at: string | null;
    description: string | null;
  }>,
  hourlyRate: number,
  year: number,
  currentMonth: number,
): { cashFlow: FinanceCashFlow; ledger: FinanceLedgerEntry[] } {
  const inflowMonths = Array.from({ length: 12 }, () => 0);
  const outflowMonths = Array.from({ length: 12 }, () => 0);
  const projectNames = new Map(projectList.map((p) => [p.id, p.name]));
  const ledger: FinanceLedgerEntry[] = [];

  for (const p of projectList) {
    const budget = p.contract_value ?? 0;
    if (budget <= 0 || p.payment_status !== "received") continue;
    const dateStr = receivedDateForChart(
      p.received_at,
      p.payment_status,
      p.updated_at,
    );
    if (!dateStr) continue;
    addToMonthBucket(inflowMonths, dateStr, budget, year);
    ledger.push({
      id: `in-${p.id}-${dateStr}`,
      date: dateStr,
      type: "credit",
      category: "recebimento",
      description: `Recebimento · ${p.name}`,
      amount: budget,
      projectId: p.id,
      projectName: p.name,
    });
  }

  for (const c of costRows) {
    const amount = Number(c.amount);
    if (amount <= 0) continue;
    const dateStr = c.incurred_at.slice(0, 10);
    addToMonthBucket(outflowMonths, dateStr, amount, year);
    ledger.push({
      id: `cost-${c.id}`,
      date: dateStr,
      type: "debit",
      category: "custo",
      description: c.description,
      amount,
      projectId: c.project_id,
      projectName: projectNames.get(c.project_id) ?? "—",
    });
  }

  for (const s of sessionRows) {
    if (!s.ended_at) continue;
    const end = new Date(s.ended_at).getTime();
    const ms = Math.max(0, end - new Date(s.started_at).getTime());
    const amount = (ms / 3_600_000) * hourlyRate;
    if (amount <= 0) continue;
    const dateStr = s.started_at.slice(0, 10);
    addToMonthBucket(outflowMonths, dateStr, amount, year);
    ledger.push({
      id: `labor-${s.id}`,
      date: dateStr,
      type: "debit",
      category: "mao_de_obra",
      description: s.description?.trim()
        ? `Mão de obra · ${s.description}`
        : "Mão de obra · sessão",
      amount: Math.round(amount * 100) / 100,
      projectId: s.project_id,
      projectName: projectNames.get(s.project_id) ?? "—",
    });
  }

  ledger.sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);

  const months: FinanceCashFlowMonth[] = MONTH_LABELS.map((label, i) => ({
    key: `${year}-${i}`,
    label,
    inflow: inflowMonths[i] ?? 0,
    outflow: outflowMonths[i] ?? 0,
    net: (inflowMonths[i] ?? 0) - (outflowMonths[i] ?? 0),
    isCurrent: i === currentMonth,
  }));

  const ytdInflow = inflowMonths.reduce((s, v) => s + v, 0);
  const ytdOutflow = outflowMonths.reduce((s, v) => s + v, 0);

  return {
    cashFlow: {
      year,
      months,
      ytdInflow,
      ytdOutflow,
      ytdNet: ytdInflow - ytdOutflow,
      monthInflow: inflowMonths[currentMonth] ?? 0,
      monthOutflow: outflowMonths[currentMonth] ?? 0,
      monthNet:
        (inflowMonths[currentMonth] ?? 0) - (outflowMonths[currentMonth] ?? 0),
    },
    ledger: ledger.slice(0, 50),
  };
}

function marginPercent(budget: number, margin: number): number | null {
  if (budget <= 0) return null;
  return Math.round((margin / budget) * 100);
}

function receivedDateForChart(
  receivedAt: string | null,
  paymentStatus: PaymentStatus,
  updatedAt: string,
): string | null {
  if (receivedAt) return receivedAt.slice(0, 10);
  if (paymentStatus === "received") return updatedAt.slice(0, 10);
  return null;
}

export function buildMonthlyReceivedTotals(
  rows: Array<{
    budget: number;
    paymentStatus: PaymentStatus;
    receivedAt: string | null;
    updatedAt?: string;
  }>,
  year: number,
): number[] {
  const monthly = Array.from({ length: 12 }, () => 0);
  for (const r of rows) {
    const dateStr = receivedDateForChart(
      r.receivedAt,
      r.paymentStatus,
      r.updatedAt ?? "",
    );
    if (!dateStr || r.budget <= 0) continue;
    const d = parseISO(dateStr);
    if (!isValid(d) || d.getFullYear() !== year) continue;
    monthly[d.getMonth()] += r.budget;
  }
  return monthly;
}

export async function getFinancePageData(): Promise<FinancePageData> {
  const supabase = await createSupabaseServerClient();
  const [marginAlertPercent, hourlyRate] = await Promise.all([
    getMarginAlertPercent(),
    getHourlyRate(),
  ]);

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, contract_value, payment_status, service_line, invoiced_at, received_at, updated_at, client_id, client:clients(id, name)",
    )
    .neq("status", "archived")
    .order("name");

  const projectList = projects ?? [];
  const projectIds = projectList.map((p) => p.id);

  const [costsRes, sessionsRes] = await Promise.all([
    projectIds.length
      ? supabase
          .from("project_costs")
          .select("id, project_id, description, amount, incurred_at")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] as const }),
    projectIds.length
      ? supabase
          .from("time_sessions")
          .select("id, project_id, started_at, ended_at, description")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] as const }),
  ]);

  const allCosts = costsRes.data ?? [];
  const allSessions = sessionsRes.data ?? [];

  const costsByProject = new Map<string, number>();
  for (const c of allCosts ?? []) {
    costsByProject.set(
      c.project_id,
      (costsByProject.get(c.project_id) ?? 0) + Number(c.amount),
    );
  }

  const hoursMsByProject = new Map<string, number>();
  for (const s of allSessions ?? []) {
    const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
    const ms = Math.max(0, end - new Date(s.started_at).getTime());
    hoursMsByProject.set(s.project_id, (hoursMsByProject.get(s.project_id) ?? 0) + ms);
  }

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  let toInvoice = 0;
  let invoicedOpen = 0;
  let receivedThisMonth = 0;

  const rows: FinanceOverviewRow[] = projectList.map((p) => {
    const budget = p.contract_value ?? 0;
    const costsTotal = costsByProject.get(p.id) ?? 0;
    const hoursMs = hoursMsByProject.get(p.id) ?? 0;
    const laborCost = (hoursMs / 3_600_000) * hourlyRate;
    const margin = budget - costsTotal - laborCost;
    const mp = marginPercent(budget, margin);
    const client = p.client as unknown as { id?: string; name?: string } | null;

    if (p.payment_status === "to_invoice") toInvoice += budget;
    if (p.payment_status === "invoiced") invoicedOpen += budget;
    if (p.payment_status === "received" && p.received_at) {
      if (p.received_at >= monthStart && p.received_at <= monthEnd) {
        receivedThisMonth += budget;
      }
    } else if (
      p.payment_status === "received" &&
      !p.received_at &&
      p.updated_at.slice(0, 10) >= monthStart &&
      p.updated_at.slice(0, 10) <= monthEnd
    ) {
      receivedThisMonth += budget;
    }

    return {
      projectId: p.id,
      projectName: p.name,
      clientId: p.client_id,
      clientName: client?.name ?? "—",
      paymentStatus: p.payment_status as PaymentStatus,
      serviceLine: p.service_line as ServiceLine | null,
      invoicedAt: p.invoiced_at,
      receivedAt: p.received_at,
      budget,
      costsTotal,
      laborCost,
      margin,
      marginPercent: mp,
      marginAtRisk: mp != null && mp < marginAlertPercent,
    };
  });

  const atRisk = rows
    .filter((r) => r.marginAtRisk && r.budget > 0)
    .sort((a, b) => (a.marginPercent ?? 0) - (b.marginPercent ?? 0));

  const clientAgg = new Map<
    string,
    { name: string; count: number; revenue: number; margins: number[] }
  >();
  for (const r of rows) {
    if (r.paymentStatus !== "received" || r.budget <= 0) continue;
    const cur = clientAgg.get(r.clientId) ?? {
      name: r.clientName,
      count: 0,
      revenue: 0,
      margins: [],
    };
    cur.count += 1;
    cur.revenue += r.budget;
    if (r.marginPercent != null) cur.margins.push(r.marginPercent);
    clientAgg.set(r.clientId, cur);
  }

  const topClients: FinanceTopClient[] = [...clientAgg.entries()]
    .map(([clientId, v]) => ({
      clientId,
      clientName: v.name,
      projectCount: v.count,
      revenueReceived: v.revenue,
      avgMarginPercent:
        v.margins.length > 0
          ? Math.round(v.margins.reduce((a, b) => a + b, 0) / v.margins.length)
          : null,
    }))
    .sort((a, b) => b.revenueReceived - a.revenueReceived)
    .slice(0, 5);

  const lineAgg = new Map<ServiceLine, { count: number; sum: number }>();
  for (const r of rows) {
    if (!r.serviceLine || r.budget <= 0) continue;
    const cur = lineAgg.get(r.serviceLine) ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += r.budget;
    lineAgg.set(r.serviceLine, cur);
  }

  const ticketsByLine: FinanceServiceLineTicket[] = [...lineAgg.entries()]
    .map(([serviceLine, v]) => ({
      serviceLine,
      label: serviceLineLabels[serviceLine],
      projectCount: v.count,
      avgContract: Math.round(v.sum / v.count),
    }))
    .sort((a, b) => b.avgContract - a.avgContract);

  const clientsMap = new Map<string, string>();
  for (const r of rows) clientsMap.set(r.clientId, r.clientName);

  const { cashFlow, ledger } = buildCashFlowAndLedger(
    projectList.map((p) => ({
      id: p.id,
      name: p.name,
      contract_value: p.contract_value,
      payment_status: p.payment_status as PaymentStatus,
      received_at: p.received_at,
      updated_at: p.updated_at,
    })),
    (allCosts ?? []) as {
      id: string;
      project_id: string;
      description: string;
      amount: number;
      incurred_at: string;
    }[],
    (allSessions ?? []) as {
      id: string;
      project_id: string;
      started_at: string;
      ended_at: string | null;
      description: string | null;
    }[],
    hourlyRate,
    now.getFullYear(),
    now.getMonth(),
  );

  return {
    rows,
    receivables: { toInvoice, invoicedOpen, receivedThisMonth },
    atRisk,
    topClients,
    ticketsByLine,
    marginAlertPercent,
    clients: [...clientsMap.entries()].map(([id, name]) => ({ id, name })),
    cashFlow,
    ledger,
  };
}

/** Resumo financeiro em lote para lista de projetos (sem N+1) */
export async function batchProjectFinanceSummaries(
  items: Array<{ id: string; contract_value: number | null }>,
): Promise<
  Map<string, ProjectFinanceSummary & { marginPercent: number | null }>
> {
  if (items.length === 0) return new Map();

  const supabase = await createSupabaseServerClient();
  const hourlyRate = await getHourlyRate();
  const ids = items.map((p) => p.id);

  const [{ data: allCosts }, { data: allSessions }] = await Promise.all([
    supabase.from("project_costs").select("project_id, amount").in("project_id", ids),
    supabase
      .from("time_sessions")
      .select("project_id, started_at, ended_at")
      .in("project_id", ids),
  ]);

  const costsByProject = new Map<string, number>();
  for (const c of allCosts ?? []) {
    costsByProject.set(
      c.project_id,
      (costsByProject.get(c.project_id) ?? 0) + Number(c.amount),
    );
  }

  const hoursMsByProject = new Map<string, number>();
  for (const s of allSessions ?? []) {
    const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
    const ms = Math.max(0, end - new Date(s.started_at).getTime());
    hoursMsByProject.set(s.project_id, (hoursMsByProject.get(s.project_id) ?? 0) + ms);
  }

  const result = new Map<
    string,
    ProjectFinanceSummary & { marginPercent: number | null }
  >();

  for (const p of items) {
    const budget = p.contract_value ?? 0;
    const costsTotal = costsByProject.get(p.id) ?? 0;
    const hoursMs = hoursMsByProject.get(p.id) ?? 0;
    const laborCost = (hoursMs / 3_600_000) * hourlyRate;
    const margin = budget - costsTotal - laborCost;
    result.set(p.id, {
      budget,
      costsTotal,
      hoursMs,
      hourlyRate,
      laborCost,
      margin,
      marginPercent: budget > 0 ? Math.round((margin / budget) * 100) : null,
    });
  }

  return result;
}

export type { ProjectFinanceSummary };
