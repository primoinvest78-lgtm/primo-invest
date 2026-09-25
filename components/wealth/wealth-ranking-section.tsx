"use client";

import { PanelAction } from "@/components/ui/panel-action";
import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import type { WealthOverview } from "@/lib/data/wealth";

export function WealthRankingSection({ overview }: { overview: WealthOverview }) {
  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="text-h2 font-bold text-foreground">Maiores componentes patrimoniais</h3>
        <PanelAction href="/patrimonio/investimentos">Ver investimentos</PanelAction>
      </div>
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
