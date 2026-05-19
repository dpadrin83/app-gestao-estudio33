import { differenceInCalendarDays, parseISO } from "date-fns";
import type { ProjectStatus } from "@/types/database";

export interface ProjectProductionTime {
  daysInProduction: number | null;
  daysUntilDelivery: number | null;
  isOverdue: boolean;
  /** Texto curto para o card — ex.: "12 dias em produção" */
  productionLabel: string;
  /** Texto da previsão — ex.: "Faltam 8 dias" ou "Previsão: 20 mai" */
  deliveryLabel: string;
}

export function computeProductionTime(
  startDate: string | null,
  expectedEndDate: string | null,
  status: ProjectStatus,
): ProjectProductionTime {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysInProduction: number | null = null;
  if (startDate) {
    const start = parseISO(startDate);
    daysInProduction = Math.max(0, differenceInCalendarDays(today, start));
  }

  let daysUntilDelivery: number | null = null;
  let isOverdue = false;
  if (expectedEndDate) {
    const end = parseISO(expectedEndDate);
    daysUntilDelivery = differenceInCalendarDays(end, today);
    if (status === "in_progress" && daysUntilDelivery < 0) {
      isOverdue = true;
    }
  }

  let productionLabel = "Aguardando data de início";
  if (status === "done") {
    productionLabel =
      daysInProduction != null
        ? `Concluído · ${daysInProduction} dias de produção`
        : "Projeto concluído";
  } else if (status === "paused") {
    productionLabel =
      daysInProduction != null
        ? `Pausado · ${daysInProduction} dias desde o início`
        : "Projeto pausado";
  } else if (daysInProduction != null) {
    productionLabel =
      daysInProduction === 0
        ? "Iniciado hoje"
        : `${daysInProduction} ${daysInProduction === 1 ? "dia" : "dias"} em produção`;
  }

  let deliveryLabel = "Previsão de entrega a definir";
  if (status === "done") {
    deliveryLabel = "Entrega concluída";
  } else if (daysUntilDelivery != null) {
    if (isOverdue) {
      const late = Math.abs(daysUntilDelivery);
      deliveryLabel =
        late === 1 ? "1 dia além da previsão" : `${late} dias além da previsão`;
    } else if (daysUntilDelivery === 0) {
      deliveryLabel = "Previsão de entrega: hoje";
    } else if (daysUntilDelivery === 1) {
      deliveryLabel = "Falta 1 dia para a previsão";
    } else {
      deliveryLabel = `Faltam ${daysUntilDelivery} dias para a previsão`;
    }
  }

  return {
    daysInProduction,
    daysUntilDelivery,
    isOverdue,
    productionLabel,
    deliveryLabel,
  };
}
