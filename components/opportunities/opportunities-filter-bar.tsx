"use client";

import { X } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpportunityCard, StageColumn } from "@/lib/data/opportunities";
import { PRIORITY_LABEL } from "@/lib/utils/opportunity-helpers";
import {
  DEFAULT_OPPORTUNITY_FILTERS,
  hasActiveOpportunityFilters,
  type OpportunityFilters,
} from "@/lib/utils/opportunity-filters";

export function OpportunitiesFilterBar({
  stages,
  opportunities,
  filters,
  onChange,
}: {
  stages: StageColumn[];
  opportunities: OpportunityCard[];
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
}) {
  const advisors = useMemo(() => {
    const map = new Map<string, string>();
    for (const opp of opportunities) {
      if (opp.assignedAdvisorId) map.set(opp.assignedAdvisorId, opp.assignedAdvisorName ?? "—");
    }
    return Array.from(map.entries());
  }, [opportunities]);

  const sources = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.source).filter((s): s is string => Boolean(s)))),
    [opportunities],
  );

  const types = useMemo(
    () =>
      Array.from(
        new Set(opportunities.map((o) => o.opportunityType).filter((s): s is string => Boolean(s))),
      ),
    [opportunities],
  );

  function set<K extends keyof OpportunityFilters>(key: K, value: OpportunityFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Etapa</label>
        <Select value={filters.stageId} onValueChange={(v) => set("stageId", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Status</label>
        <Select
          value={filters.status}
          onValueChange={(v) => set("status", (v ?? "all") as OpportunityFilters["status"])}
        >
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="won">Ganha</SelectItem>
            <SelectItem value="lost">Perdida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Responsável
        </label>
        <Select value={filters.advisorId} onValueChange={(v) => set("advisorId", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="none">Sem responsável</SelectItem>
            {advisors.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Categoria
        </label>
        <Select value={filters.opportunityType} onValueChange={(v) => set("opportunityType", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Origem</label>
        <Select value={filters.source} onValueChange={(v) => set("source", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="none">Sem origem</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Prioridade
        </label>
        <Select value={filters.priority} onValueChange={(v) => set("priority", v ?? "all")}>
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Valor mín.
        </label>
        <Input
          type="number"
          className="h-7 w-[110px] text-sm"
          value={filters.valueMin}
          onChange={(e) => set("valueMin", e.target.value)}
          placeholder="R$"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Valor máx.
        </label>
        <Input
          type="number"
          className="h-7 w-[110px] text-sm"
          value={filters.valueMax}
          onChange={(e) => set("valueMax", e.target.value)}
          placeholder="R$"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">De</label>
        <Input
          type="date"
          className="h-7 w-[140px] text-sm"
          value={filters.createdFrom}
          onChange={(e) => set("createdFrom", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Até</label>
        <Input
          type="date"
          className="h-7 w-[140px] text-sm"
          value={filters.createdTo}
          onChange={(e) => set("createdTo", e.target.value)}
        />
      </div>

      {hasActiveOpportunityFilters(filters) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(DEFAULT_OPPORTUNITY_FILTERS)}
          className="gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
