"use client";

import { useMemo } from "react";

import { LeadsOriginPieChart } from "@/components/leads/charts/leads-origin-pie-chart";
import type { LeadListItem } from "@/lib/data/leads";

const MIN_TOTAL_FOR_PIE = 3;
const MAX_CATEGORIES_FOR_PIE = 7;

export function LeadsOriginSection({ leads }: { leads: LeadListItem[] }) {
  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads) {
      const source = lead.source ?? "Sem origem";
      map.set(source, (map.get(source) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const total = leads.length;
  const categoriesCount = breakdown.length;
  const pieEligible =
    total >= MIN_TOTAL_FOR_PIE && categoriesCount >= 2 && categoriesCount <= MAX_CATEGORIES_FOR_PIE;

  if (total === 0) {
    return (
      <p className="text-body-sm text-card-beige-muted-foreground">
        Sem leads suficientes pra montar a distribuição por origem.
      </p>
    );
  }

  if (pieEligible) {
    return <LeadsOriginPieChart data={breakdown} />;
  }

  return (
    <div className="space-y-2">
      {breakdown.map((entry) => (
        <div
          key={entry.source}
          className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm"
        >
          <span className="truncate font-medium text-foreground">{entry.source}</span>
          <span className="shrink-0 font-bold text-card-beige-muted-foreground">{entry.count}</span>
        </div>
      ))}
    </div>
  );
}
