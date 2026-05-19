export type ServiceDueStatus = "overdue" | "soon" | "ok" | "inactive";

export function getServiceDueStatus(
  nextDueDate: string,
  isActive: boolean,
  soonDays = 30,
): { status: ServiceDueStatus; daysUntil: number } {
  if (!isActive) {
    return { status: "inactive", daysUntil: 0 };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  due.setHours(0, 0, 0, 0);
  const daysUntil = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntil < 0) return { status: "overdue", daysUntil };
  if (daysUntil <= soonDays) return { status: "soon", daysUntil };
  return { status: "ok", daysUntil };
}

export function serviceDueLabel(daysUntil: number, status: ServiceDueStatus): string {
  if (status === "inactive") return "inativo";
  if (status === "overdue") {
    const n = Math.abs(daysUntil);
    return n === 1 ? "venceu ontem" : `vencido há ${n} dias`;
  }
  if (daysUntil === 0) return "vence hoje";
  if (daysUntil === 1) return "vence amanhã";
  return `vence em ${daysUntil} dias`;
}
