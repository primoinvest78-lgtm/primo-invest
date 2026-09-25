"use client";

import { LayoutGrid, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { OpportunitiesBoard } from "@/components/opportunities/opportunities-board";
import { OpportunitiesCharts } from "@/components/opportunities/opportunities-charts";
import { OpportunitiesFilterBar } from "@/components/opportunities/opportunities-filter-bar";
import { OpportunitiesKpis } from "@/components/opportunities/opportunities-kpis";
import { OpportunitiesPriorityPanel } from "@/components/opportunities/opportunities-priority-panel";
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table";
import { scrollToId } from "@/components/ui/panel-action";
import type { StageColumn } from "@/lib/data/opportunities";
import {
  applyOpportunityFilters,
  DEFAULT_OPPORTUNITY_FILTERS,
  type OpportunityFilters,
} from "@/lib/utils/opportunity-filters";

/** Lê os filtros iniciais da URL (?status=open&stageId=...&signal=stalled) —
 * é assim que cards do Dashboard/Hub CRM chegam aqui já filtrados. */
function filtersFromSearchParams(params: URLSearchParams): OpportunityFilters {
  const status = params.get("status");
  const stageId = params.get("stageId");
  const signal = params.get("signal");
  return {
    ...DEFAULT_OPPORTUNITY_FILTERS,
    status: (["open", "won", "lost"].includes(status ?? "")
      ? status
      : DEFAULT_OPPORTUNITY_FILTERS.status) as OpportunityFilters["status"],
    stageId: stageId ?? DEFAULT_OPPORTUNITY_FILTERS.stageId,
    signal: (signal === "stalled" ? "stalled" : DEFAULT_OPPORTUNITY_FILTERS.signal) as OpportunityFilters["signal"],
  };
}

export function OpportunitiesView({ stages }: { stages: StageColumn[] }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [filters, setFilters] = useState<OpportunityFilters>(() => filtersFromSearchParams(searchParams));

  const allOpportunities = useMemo(() => stages.flatMap((s) => s.opportunities), [stages]);

  const filteredOpportunities = useMemo(
    () => applyOpportunityFilters(allOpportunities, filters),
    [allOpportunities, filters],
  );

  const filteredStages = useMemo<StageColumn[]>(() => {
    const filteredIds = new Set(filteredOpportunities.map((o) => o.id));
    return stages.map((stage) => ({
      ...stage,
      opportunities: stage.opportunities.filter((o) => filteredIds.has(o.id)),
    }));
  }, [stages, filteredOpportunities]);

  const stageProbabilityById = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const stage of stages) map.set(stage.id, stage.probability);
    return map;
  }, [stages]);

  return (
    <div className="space-y-5">
      <OpportunitiesKpis
        opportunities={filteredOpportunities}
        stageProbabilityById={stageProbabilityById}
        onApplyFilters={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />

      <OpportunitiesPriorityPanel opportunities={filteredOpportunities} />

      <OpportunitiesCharts
        stages={filteredStages}
        opportunities={filteredOpportunities}
        onApplyFilters={(patch) => {
          setFilters({ ...DEFAULT_OPPORTUNITY_FILTERS, ...patch });
          scrollToId("lista-oportunidades");
        }}
      />

      <div id="lista-oportunidades" className="scroll-mt-24" />
      <OpportunitiesFilterBar
        stages={stages}
        opportunities={allOpportunities}
        filters={filters}
        onChange={setFilters}
      />

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

      {view === "kanban" ? (
        <OpportunitiesBoard stages={filteredStages} />
      ) : (
        <OpportunitiesTable stages={filteredStages} />
      )}
    </div>
  );
}
