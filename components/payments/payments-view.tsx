"use client";

import { useState } from "react";

import { EvidenceQueue, type TabKey } from "@/components/payments/evidence-queue";
import { PaymentsCharts } from "@/components/payments/payments-charts";
import { PaymentsKpis } from "@/components/payments/payments-kpis";
import { scrollToId } from "@/components/ui/panel-action";
import type { PaymentDashboardData } from "@/lib/data/payments";
import type { MatchableClient, MatchableInstallment } from "@/lib/payments/matching";
import type { PaymentEvidence } from "@/lib/payments/types";

/**
 * Liga os KPIs à fila abaixo: clicar em "Conciliados", por exemplo,
 * seleciona a mesma aba na fila, sem duplicar o estado de filtro.
 */
export function PaymentsView({
  dashboardData,
  evidences,
  clients,
  installments,
}: {
  dashboardData: PaymentDashboardData;
  evidences: PaymentEvidence[];
  clients: MatchableClient[];
  installments: MatchableInstallment[];
}) {
  const [tab, setTab] = useState<TabKey>("todos");

  return (
    <>
      <PaymentsKpis data={dashboardData} onSelectTab={setTab} />

      <PaymentsCharts
        data={dashboardData}
        onSelectTab={(t) => {
          setTab(t);
          scrollToId("fila-comprovantes");
        }}
      />

      <div id="fila-comprovantes" className="scroll-mt-24" />
      <EvidenceQueue
        evidences={evidences}
        clients={clients}
        installments={installments}
        tab={tab}
        onTabChange={setTab}
      />
    </>
  );
}
