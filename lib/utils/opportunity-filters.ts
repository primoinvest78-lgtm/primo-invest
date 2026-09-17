import type { OpportunityCard } from "@/lib/data/opportunities";
import { daysSince, isOpenOpportunity } from "@/lib/utils/opportunity-helpers";

/** Espelha computeOpportunityPriorities().stalled — usado pra linkar
 * cards do Dashboard/Hub CRM direto pra essa mesma lista filtrada. */
export type OpportunitySignalFilter = "all" | "stalled";

export type OpportunityFilters = {
  stageId: string;
  status: "all" | "open" | "won" | "lost";
  advisorId: string;
  source: string;
  opportunityType: string;
  priority: string;
  signal: OpportunitySignalFilter;
  valueMin: string;
  valueMax: string;
  createdFrom: string;
  createdTo: string;
};

export const DEFAULT_OPPORTUNITY_FILTERS: OpportunityFilters = {
  stageId: "all",
  status: "all",
  advisorId: "all",
  source: "all",
  opportunityType: "all",
  priority: "all",
  signal: "all",
  valueMin: "",
  valueMax: "",
  createdFrom: "",
  createdTo: "",
};

export function hasActiveOpportunityFilters(filters: OpportunityFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "valueMin" || key === "valueMax" || key === "createdFrom" || key === "createdTo") {
      return value !== "";
    }
    return value !== "all";
  });
}

export function applyOpportunityFilters(
  opportunities: OpportunityCard[],
  filters: OpportunityFilters,
): OpportunityCard[] {
  return opportunities.filter((opp) => {
    if (filters.stageId !== "all" && opp.stageId !== filters.stageId) return false;
    if (filters.status !== "all" && opp.status !== filters.status) return false;

    if (filters.advisorId !== "all") {
      if (filters.advisorId === "none" ? opp.assignedAdvisorId !== null : opp.assignedAdvisorId !== filters.advisorId) {
        return false;
      }
    }

    if (filters.source !== "all") {
      if (filters.source === "none" ? opp.source !== null : opp.source !== filters.source) {
        return false;
      }
    }

    if (filters.opportunityType !== "all" && opp.opportunityType !== filters.opportunityType) {
      return false;
    }

    if (filters.priority !== "all" && opp.priority !== filters.priority) return false;

    if (filters.signal === "stalled") {
      if (!isOpenOpportunity(opp.status)) return false;
      if (daysSince(opp.lastActivityAt ?? opp.createdAt) <= 20) return false;
    }

    if (filters.valueMin !== "") {
      const min = Number(filters.valueMin);
      if (!Number.isNaN(min) && (opp.estimatedValue ?? 0) < min) return false;
    }
    if (filters.valueMax !== "") {
      const max = Number(filters.valueMax);
      if (!Number.isNaN(max) && (opp.estimatedValue ?? 0) > max) return false;
    }

    if (filters.createdFrom !== "" && opp.createdAt.slice(0, 10) < filters.createdFrom) return false;
    if (filters.createdTo !== "" && opp.createdAt.slice(0, 10) > filters.createdTo) return false;

    return true;
  });
}
