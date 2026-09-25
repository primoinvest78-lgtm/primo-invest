"use client";

import { useMemo } from "react";

import { LeadsEvolutionChart, type LeadsEvolutionPoint } from "@/components/leads/charts/leads-evolution-chart";
import { LeadsPipelineBarChart } from "@/components/leads/charts/leads-pipeline-bar-chart";
import { LeadsOriginSection } from "@/components/leads/leads-origin-section";
import { PanelAction } from "@/components/ui/panel-action";
import { LEAD_STATUSES } from "@/lib/data/lead-statuses";
import type { LeadListItem } from "@/lib/data/leads";
import type { LeadFilters } from "@/lib/utils/lead-filters";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(".", "");
}

function buildMonthRange(startKey: string, endKey: string): string[] {
  const months: string[] = [];
  let [y, m] = startKey.split("-").map(Number);
  const [endY, endM] = endKey.split("-").map(Number);

  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

export function LeadsCharts({
  leads,
  onApplyFilters,
}: {
  leads: LeadListItem[];
  /** Clicar num gráfico filtra a lista logo abaixo. */
  onApplyFilters?: (patch: Partial<LeadFilters>) => void;
}) {
  const evolutionData = useMemo<LeadsEvolutionPoint[] | null>(() => {
    if (leads.length === 0) return null;

    const createdMonths = leads.map((l) => monthKey(l.createdAt));
    const earliestMonth = createdMonths.sort()[0];
    const currentMonth = monthKey(new Date().toISOString());

    const months = buildMonthRange(earliestMonth, currentMonth);
    if (months.length < 2) return null;

    const novosByMonth = new Map<string, number>();
    const convertidosByMonth = new Map<string, number>();

    for (const lead of leads) {
      const created = monthKey(lead.createdAt);
      novosByMonth.set(created, (novosByMonth.get(created) ?? 0) + 1);
      if (lead.convertedAt) {
        const converted = monthKey(lead.convertedAt);
        convertidosByMonth.set(converted, (convertidosByMonth.get(converted) ?? 0) + 1);
      }
    }

    return months.map((month) => ({
      month: monthLabel(month),
      novos: novosByMonth.get(month) ?? 0,
      convertidos: convertidosByMonth.get(month) ?? 0,
    }));
  }, [leads]);

  const pipelineData = useMemo(
    () =>
      LEAD_STATUSES.map((stage) => ({
        stage,
        count: leads.filter((l) => l.status === stage).length,
      })),
    [leads],
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-h2 font-bold text-foreground">Evolução e conversão</h3>
          {onApplyFilters ? <PanelAction onClick={() => onApplyFilters({ status: "Convertido" })}>Ver convertidos</PanelAction> : null}
        </div>
        {evolutionData === null ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem histórico suficiente pra montar a evolução ao longo do tempo.
          </p>
        ) : (
          <LeadsEvolutionChart data={evolutionData} />
        )}
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-h2 font-bold text-foreground">Pipeline por etapa</h3>
          {onApplyFilters ? <PanelAction onClick={() => onApplyFilters({})}>Ver todos</PanelAction> : null}
        </div>
        {leads.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem leads suficientes pra montar o pipeline.
          </p>
        ) : (
          <LeadsPipelineBarChart data={pipelineData} onSelect={onApplyFilters ? (stage) => onApplyFilters({ stage }) : undefined} />
        )}
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6 lg:col-span-2">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Origem dos leads</h3>
        <LeadsOriginSection
          leads={leads}
          onSelect={onApplyFilters ? (source) => onApplyFilters({ source: source === "Sem origem" ? "none" : source }) : undefined}
        />
      </div>
    </div>
  );
}
