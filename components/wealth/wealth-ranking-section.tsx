"use client";

import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import type { WealthOverview } from "@/lib/data/wealth";

export function WealthRankingSection({ overview }: { overview: WealthOverview }) {
  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-4 text-h2 font-bold text-foreground">Maiores componentes patrimoniais</h3>
      {overview.topHoldings.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Sem ativos suficientes pra montar o ranking.
        </p>
      ) : (
        <TopClientsBarChart data={overview.topHoldings} />
      )}
    </div>
  );
}
