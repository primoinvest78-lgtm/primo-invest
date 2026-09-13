"use client";

import { useMemo, useState } from "react";

import { AdjustmentsHistorySection } from "@/components/consortiums/parcelas/adjustments-history-section";
import { InstallmentsFilterBar } from "@/components/consortiums/parcelas/installments-filter-bar";
import { InstallmentsKpis } from "@/components/consortiums/parcelas/installments-kpis";
import { InstallmentsProgressSection } from "@/components/consortiums/parcelas/installments-progress-section";
import { InstallmentsTable } from "@/components/consortiums/parcelas/installments-table";
import { NextInstallmentHighlight } from "@/components/consortiums/parcelas/next-installment-highlight";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import { WealthEvolutionSection } from "@/components/wealth/wealth-evolution-section";
import type { ConsortiumContract, ConsortiumInstallment, InstallmentAdjustmentEvent } from "@/lib/data/consortiums";
import {
  applyInstallmentFilters,
  computeInstallmentAlerts,
  computePaidHistory,
  DEFAULT_INSTALLMENT_FILTERS,
  type InstallmentFilters,
} from "@/lib/utils/installment-helpers";

export function ParcelasView({
  installments,
  contracts,
  adjustmentEvents,
}: {
  installments: ConsortiumInstallment[];
  contracts: ConsortiumContract[];
  adjustmentEvents: InstallmentAdjustmentEvent[];
}) {
  const [filters, setFilters] = useState<InstallmentFilters>(DEFAULT_INSTALLMENT_FILTERS);

  const filtered = useMemo(() => applyInstallmentFilters(installments, filters), [installments, filters]);
  const alerts = useMemo(() => computeInstallmentAlerts(installments, contracts), [installments, contracts]);
  const history = useMemo(() => computePaidHistory(installments), [installments]);

  return (
    <div className="space-y-6">
      <NextInstallmentHighlight installments={installments} />

      <InstallmentsKpis installments={installments} />

      <WealthAlertsSection alerts={alerts} />

      <InstallmentsProgressSection installments={installments} />

      <WealthEvolutionSection
        history={history}
        title="Evolução dos pagamentos"
        emptyMessage="Sem pagamentos registrados com data suficiente pra montar a evolução ainda."
      />

      <AdjustmentsHistorySection events={adjustmentEvents} />

      <InstallmentsFilterBar installments={installments} filters={filters} onChange={setFilters} />

      <InstallmentsTable installments={filtered} contracts={contracts} />
    </div>
  );
}
