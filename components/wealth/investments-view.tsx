"use client";

import { useMemo, useState } from "react";

import { InvestmentsAllocationSection } from "@/components/wealth/investments-allocation-section";
import { InvestmentsConcentrationSection } from "@/components/wealth/investments-concentration-section";
import { InvestmentsFilterBar } from "@/components/wealth/investments-filter-bar";
import { InvestmentsKpis } from "@/components/wealth/investments-kpis";
import { InvestmentsRankingSection } from "@/components/wealth/investments-ranking-section";
import { InvestmentsTable } from "@/components/wealth/investments-table";
import { WealthEvolutionSection } from "@/components/wealth/wealth-evolution-section";
import type { HoldingDetail, WealthHistoryPoint } from "@/lib/data/wealth";
import {
  applyInvestmentFilters,
  DEFAULT_INVESTMENT_FILTERS,
  type InvestmentFilters,
} from "@/lib/utils/investment-helpers";

export function InvestmentsView({
  holdings,
  history,
}: {
  holdings: HoldingDetail[];
  history: WealthHistoryPoint[];
}) {
  const [filters, setFilters] = useState<InvestmentFilters>(DEFAULT_INVESTMENT_FILTERS);

  const filteredHoldings = useMemo(() => applyInvestmentFilters(holdings, filters), [holdings, filters]);

  return (
    <div className="space-y-6">
      <InvestmentsKpis holdings={filteredHoldings} history={history} />

      <InvestmentsFilterBar holdings={holdings} filters={filters} onChange={setFilters} />

      <WealthEvolutionSection
        history={history}
        title="Performance da carteira"
        emptyMessage="Sem transações suficientes registradas pra montar a performance da carteira ao longo do tempo."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <InvestmentsAllocationSection holdings={filteredHoldings} />
        <InvestmentsConcentrationSection holdings={filteredHoldings} />
      </div>

      <InvestmentsRankingSection holdings={filteredHoldings} />

      <InvestmentsTable holdings={filteredHoldings} />
    </div>
  );
}
