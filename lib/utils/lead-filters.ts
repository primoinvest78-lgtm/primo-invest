import type { LeadListItem } from "@/lib/data/leads";
import { computeLeadScore, type LeadScoreTier } from "@/lib/utils/lead-score";

export type LeadFilters = {
  stage: string;
  status: "all" | "aberto" | "Convertido" | "Perdido";
  advisorId: string;
  source: string;
  scoreTier: "all" | LeadScoreTier;
  interest: string;
  netWorthMin: string;
  netWorthMax: string;
  createdFrom: string;
  createdTo: string;
};

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  stage: "all",
  status: "all",
  advisorId: "all",
  source: "all",
  scoreTier: "all",
  interest: "all",
  netWorthMin: "",
  netWorthMax: "",
  createdFrom: "",
  createdTo: "",
};

export function hasActiveLeadFilters(filters: LeadFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "netWorthMin" || key === "netWorthMax" || key === "createdFrom" || key === "createdTo") {
      return value !== "";
    }
    return value !== "all";
  });
}

export function applyLeadFilters(leads: LeadListItem[], filters: LeadFilters): LeadListItem[] {
  return leads.filter((lead) => {
    if (filters.stage !== "all" && lead.status !== filters.stage) return false;

    if (filters.status === "aberto" && (lead.status === "Convertido" || lead.status === "Perdido")) {
      return false;
    }
    if (filters.status === "Convertido" && lead.status !== "Convertido") return false;
    if (filters.status === "Perdido" && lead.status !== "Perdido") return false;

    if (filters.advisorId !== "all") {
      if (filters.advisorId === "none" ? lead.assignedAdvisorId !== null : lead.assignedAdvisorId !== filters.advisorId) {
        return false;
      }
    }

    if (filters.source !== "all") {
      if (filters.source === "none" ? lead.source !== null : lead.source !== filters.source) {
        return false;
      }
    }

    if (filters.interest !== "all") {
      if (filters.interest === "none" ? lead.interest !== null : lead.interest !== filters.interest) {
        return false;
      }
    }

    if (filters.scoreTier !== "all" && computeLeadScore(lead).tier !== filters.scoreTier) {
      return false;
    }

    if (filters.netWorthMin !== "") {
      const min = Number(filters.netWorthMin);
      if (!Number.isNaN(min) && (lead.estimatedNetWorth ?? 0) < min) return false;
    }
    if (filters.netWorthMax !== "") {
      const max = Number(filters.netWorthMax);
      if (!Number.isNaN(max) && (lead.estimatedNetWorth ?? 0) > max) return false;
    }

    if (filters.createdFrom !== "") {
      if (lead.createdAt.slice(0, 10) < filters.createdFrom) return false;
    }
    if (filters.createdTo !== "") {
      if (lead.createdAt.slice(0, 10) > filters.createdTo) return false;
    }

    return true;
  });
}
