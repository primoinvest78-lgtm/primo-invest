"use client";

import Link from "next/link";

import { AllocationBar } from "@/components/wealth/allocation-bar";
import { AllocationPieChart } from "@/components/wealth/allocation-pie-chart";
import type { WealthOverview } from "@/lib/data/wealth";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function WealthCompositionSection({ overview }: { overview: WealthOverview }) {
  const total = overview.allocation.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h2 font-bold text-foreground">Composição do patrimônio</h3>
        <Link href="/patrimonio/investimentos" className="text-xs font-semibold text-accent hover:underline">
          Ver investimentos
        </Link>
      </div>
      {overview.allocation.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Sem posições registradas suficientes pra montar a composição.
        </p>
      ) : (
        <>
          <AllocationPieChart data={overview.allocation} />
          <div className="mt-3 space-y-3">
            {overview.allocation
              .sort((a, b) => b.value - a.value)
              .map((item, index) => {
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                const color = CHART_SEQUENCE[index % CHART_SEQUENCE.length];

                return (
                  <div key={item.productType}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.productType}</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrencyBRL(item.value)} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <AllocationBar percentage={pct} color={color} delay={index * 0.05} />
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
