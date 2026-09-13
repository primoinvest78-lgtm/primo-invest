"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { AllocationBar } from "@/components/wealth/allocation-bar";
import { AllocationPieChart } from "@/components/wealth/allocation-pie-chart";
import type { HoldingDetail } from "@/lib/data/wealth";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function InvestmentsAllocationSection({ holdings }: { holdings: HoldingDetail[] }) {
  const allocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holdings) {
      const type = h.productType ?? "Outros";
      map.set(type, (map.get(type) ?? 0) + Number(h.valuation ?? 0));
    }
    return Array.from(map.entries())
      .map(([productType, value]) => ({ productType, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const total = allocation.reduce((sum, a) => sum + a.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="card-premium rounded-2xl p-5 md:p-6"
    >
      <h3 className="mb-4 text-h2 font-bold text-foreground">Alocação por classe de ativo</h3>
      {allocation.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Sem posições suficientes pra montar a alocação.
        </p>
      ) : (
        <>
          <AllocationPieChart data={allocation} />
          <div className="mt-3 space-y-3">
            {allocation.map((item, index) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.productType}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.productType}</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrencyBRL(item.value)} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <AllocationBar percentage={pct} color={CHART_SEQUENCE[index % CHART_SEQUENCE.length]} delay={index * 0.05} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
