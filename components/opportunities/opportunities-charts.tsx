"use client";

import { useMemo } from "react";

import {
  OpportunitiesEvolutionChart,
  type OpportunitiesEvolutionPoint,
} from "@/components/opportunities/charts/opportunities-evolution-chart";
import { OpportunitiesPipelineBarChart } from "@/components/opportunities/charts/opportunities-pipeline-bar-chart";
import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import type { OpportunityCard, StageColumn } from "@/lib/data/opportunities";

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

export function OpportunitiesCharts({
  stages,
  opportunities,
}: {
  stages: StageColumn[];
  opportunities: OpportunityCard[];
}) {
  const pipelineData = useMemo(
    () =>
      stages.map((stage) => ({
        stage: stage.name,
        value: stage.opportunities.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0),
      })),
    [stages],
  );

  const rankingData = useMemo(
    () =>
      [...opportunities]
        .filter((o) => o.status !== "cancelled" && o.estimatedValue)
        .sort((a, b) => Number(b.estimatedValue) - Number(a.estimatedValue))
        .slice(0, 8)
        .map((o) => ({ name: o.title, total: Number(o.estimatedValue) })),
    [opportunities],
  );

  const evolutionData = useMemo<OpportunitiesEvolutionPoint[] | null>(() => {
    const closed = opportunities.filter((o) => o.closedAt && (o.status === "won" || o.status === "lost"));
    if (closed.length === 0) return null;

    const closedMonths = closed.map((o) => monthKey(o.closedAt as string)).sort();
    const months = buildMonthRange(closedMonths[0], closedMonths[closedMonths.length - 1]);
    if (months.length < 2) return null;

    const wonByMonth = new Map<string, number>();
    const lostByMonth = new Map<string, number>();

    for (const o of closed) {
      const month = monthKey(o.closedAt as string);
      const value = Number(o.estimatedValue ?? 0);
      if (o.status === "won") wonByMonth.set(month, (wonByMonth.get(month) ?? 0) + value);
      else lostByMonth.set(month, (lostByMonth.get(month) ?? 0) + value);
    }

    return months.map((month) => ({
      month: monthLabel(month),
      ganhas: wonByMonth.get(month) ?? 0,
      perdidas: lostByMonth.get(month) ?? 0,
    }));
  }, [opportunities]);

  const lossReasonBreakdown = useMemo(() => {
    const lost = opportunities.filter((o) => o.status === "lost" && o.lossReason);
    const map = new Map<string, number>();
    for (const o of lost) {
      const reason = (o.lossReason as string).split(" — ")[0];
      map.set(reason, (map.get(reason) ?? 0) + 1);
    }
    return { total: lost.length, breakdown: Array.from(map.entries()).sort((a, b) => b[1] - a[1]) };
  }, [opportunities]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Pipeline por etapa (valor)</h3>
        {opportunities.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem oportunidades suficientes pra montar o pipeline.
          </p>
        ) : (
          <OpportunitiesPipelineBarChart data={pipelineData} />
        )}
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Maiores oportunidades</h3>
        {rankingData.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem valor estimado suficiente cadastrado pra montar o ranking.
          </p>
        ) : (
          <TopClientsBarChart data={rankingData} />
        )}
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6 lg:col-span-2">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Evolução de fechamento</h3>
        {evolutionData === null ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem histórico de fechamentos suficiente pra montar a evolução ao longo do tempo.
          </p>
        ) : (
          <OpportunitiesEvolutionChart data={evolutionData} />
        )}
      </div>

      {lossReasonBreakdown.total >= 2 ? (
        <div className="card-premium rounded-2xl p-5 md:p-6 lg:col-span-2">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Principais motivos de perda</h3>
          <div className="space-y-2">
            {lossReasonBreakdown.breakdown.map(([reason, count]) => (
              <div
                key={reason}
                className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-foreground">{reason}</span>
                <span className="shrink-0 font-bold text-card-beige-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
