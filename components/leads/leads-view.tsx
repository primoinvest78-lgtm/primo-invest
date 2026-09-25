"use client";

import { LayoutGrid, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { LeadsBoard } from "@/components/leads/leads-board";
import { LeadsCharts } from "@/components/leads/leads-charts";
import { LeadsFilterBar } from "@/components/leads/leads-filter-bar";
import { LeadsKpis } from "@/components/leads/leads-kpis";
import { LeadsPriorityPanel } from "@/components/leads/leads-priority-panel";
import { LeadsTable } from "@/components/leads/leads-table";
import { scrollToId } from "@/components/ui/panel-action";
import type { LeadListItem } from "@/lib/data/leads";
import { applyLeadFilters, DEFAULT_LEAD_FILTERS, type LeadFilters } from "@/lib/utils/lead-filters";

/** Lê os filtros iniciais da URL (?scoreTier=Quente&signal=stalled...) —
 * é assim que cards do Dashboard/Hub CRM chegam aqui já filtrados. */
function filtersFromSearchParams(params: URLSearchParams): LeadFilters {
  const scoreTier = params.get("scoreTier");
  const signal = params.get("signal");
  const status = params.get("status");
  const stage = params.get("stage");
  return {
    ...DEFAULT_LEAD_FILTERS,
    stage: stage ?? DEFAULT_LEAD_FILTERS.stage,
    status: (["aberto", "Convertido", "Perdido"].includes(status ?? "")
      ? status
      : DEFAULT_LEAD_FILTERS.status) as LeadFilters["status"],
    scoreTier: (["Quente", "Morno", "Frio"].includes(scoreTier ?? "")
      ? scoreTier
      : DEFAULT_LEAD_FILTERS.scoreTier) as LeadFilters["scoreTier"],
    signal: (["noContact", "stalled"].includes(signal ?? "")
      ? signal
      : DEFAULT_LEAD_FILTERS.signal) as LeadFilters["signal"],
  };
}

export function LeadsView({ leads }: { leads: LeadListItem[] }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [filters, setFilters] = useState<LeadFilters>(() => filtersFromSearchParams(searchParams));

  const filteredLeads = useMemo(() => applyLeadFilters(leads, filters), [leads, filters]);

  return (
    <div className="space-y-5">
      <LeadsKpis
        leads={filteredLeads}
        onApplyFilters={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />

      <LeadsPriorityPanel leads={filteredLeads} />

      <LeadsCharts
        leads={filteredLeads}
        onApplyFilters={(patch) => {
          setFilters({ ...DEFAULT_LEAD_FILTERS, ...patch });
          scrollToId("lista-leads");
        }}
      />

      <div id="lista-leads" className="scroll-mt-24">
        <LeadsFilterBar leads={leads} filters={filters} onChange={setFilters} />
      </div>

      <div className="flex justify-end gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setView("kanban")}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
            view === "kanban"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Kanban
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </button>
      </div>

      {view === "kanban" ? <LeadsBoard leads={filteredLeads} /> : <LeadsTable leads={filteredLeads} />}
    </div>
  );
}
