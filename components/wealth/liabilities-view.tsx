"use client";

import { useMemo, useState } from "react";

import { LiabilitiesChartsSection } from "@/components/wealth/liabilities-charts-section";
import { LiabilitiesFilterBar } from "@/components/wealth/liabilities-filter-bar";
import { LiabilitiesKpis } from "@/components/wealth/liabilities-kpis";
import { LiabilitiesTable } from "@/components/wealth/liabilities-table";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import type { LiabilityDetail } from "@/lib/data/wealth";
import {
  applyLiabilityFilters,
  computeLiabilityAlerts,
  DEFAULT_LIABILITY_FILTERS,
  type LiabilityFilters,
} from "@/lib/utils/liability-helpers";

export function LiabilitiesView({
  liabilities,
  clients,
  netWorth,
}: {
  liabilities: LiabilityDetail[];
  clients: { id: string; fullName: string }[];
  netWorth: number;
}) {
  const [filters, setFilters] = useState<LiabilityFilters>(DEFAULT_LIABILITY_FILTERS);

  const filtered = useMemo(() => applyLiabilityFilters(liabilities, filters), [liabilities, filters]);
  const alerts = useMemo(() => computeLiabilityAlerts(liabilities), [liabilities]);

  return (
    <div className="space-y-6">
      <LiabilitiesKpis
        liabilities={liabilities}
        netWorth={netWorth}
        onSelectAttention={() =>
          setFilters((f) => ({ ...DEFAULT_LIABILITY_FILTERS, attentionOnly: !f.attentionOnly }))
        }
        onSelectNearMaturity={() =>
          setFilters((f) => ({ ...DEFAULT_LIABILITY_FILTERS, nearMaturityOnly: !f.nearMaturityOnly }))
        }
      />

      <WealthAlertsSection
        alerts={alerts}
        hrefFor={(a) => {
          // Todo alerta de passivo é sobre um passivo específico: abre o próprio passivo.
          const m = /^(maturity|overdue|status|near-payoff|concentration|heavy-installment)-(.+)$/.exec(a.id);
          return m ? `/patrimonio/passivos/${m[2]}` : null;
        }}
      />

      <LiabilitiesChartsSection liabilities={liabilities} />

      <LiabilitiesFilterBar liabilities={liabilities} filters={filters} onChange={setFilters} />

      <LiabilitiesTable liabilities={filtered} clients={clients} />
    </div>
  );
}
