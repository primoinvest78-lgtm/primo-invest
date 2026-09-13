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
import { LEAD_STATUSES } from "@/lib/data/lead-statuses";
import type { LeadListItem } from "@/lib/data/leads";
import { DEFAULT_LEAD_FILTERS, hasActiveLeadFilters, type LeadFilters } from "@/lib/utils/lead-filters";

export function LeadsFilterBar({
  leads,
  filters,
  onChange,
}: {
  leads: LeadListItem[];
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
}) {
  const advisors = useMemo(() => {
    const map = new Map<string, string>();
    for (const lead of leads) {
      if (lead.assignedAdvisorId) map.set(lead.assignedAdvisorId, lead.assignedAdvisorName ?? "—");
    }
    return Array.from(map.entries());
  }, [leads]);

  const sources = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source).filter((s): s is string => Boolean(s)))),
    [leads],
  );

  const interests = useMemo(
    () => Array.from(new Set(leads.map((l) => l.interest).filter((s): s is string => Boolean(s)))),
    [leads],
  );

  function set<K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Etapa</label>
        <Select value={filters.stage} onValueChange={(v) => set("stage", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Status</label>
        <Select value={filters.status} onValueChange={(v) => set("status", (v ?? "all") as LeadFilters["status"])}>
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="Convertido">Convertido</SelectItem>
            <SelectItem value="Perdido">Perdido</SelectItem>
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
          Interesse
        </label>
        <Select value={filters.interest} onValueChange={(v) => set("interest", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="none">Sem interesse</SelectItem>
            {interests.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Score</label>
        <Select
          value={filters.scoreTier}
          onValueChange={(v) => set("scoreTier", (v ?? "all") as LeadFilters["scoreTier"])}
        >
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Quente">Quente</SelectItem>
            <SelectItem value="Morno">Morno</SelectItem>
            <SelectItem value="Frio">Frio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Patrimônio mín.
        </label>
        <Input
          type="number"
          className="h-7 w-[110px] text-sm"
          value={filters.netWorthMin}
          onChange={(e) => set("netWorthMin", e.target.value)}
          placeholder="R$"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Patrimônio máx.
        </label>
        <Input
          type="number"
          className="h-7 w-[110px] text-sm"
          value={filters.netWorthMax}
          onChange={(e) => set("netWorthMax", e.target.value)}
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

      {hasActiveLeadFilters(filters) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(DEFAULT_LEAD_FILTERS)}
          className="gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
