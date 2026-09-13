"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { AllocationBar } from "@/components/wealth/allocation-bar";
import { ValueByTypeBarChart } from "@/components/wealth/value-by-type-bar-chart";
import type { HoldingDetail } from "@/lib/data/wealth";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { computeConcentration, type ConcentrationEntry } from "@/lib/utils/investment-helpers";

function ConcentrationList({ title, entries }: { title: string; entries: ConcentrationEntry[] }) {
  return (
    <div>
      <p className="mb-3 text-label font-bold uppercase text-card-beige-muted-foreground">{title}</p>
      {entries.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">Sem dados suficientes.</p>
      ) : (
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry, index) => (
            <div key={entry.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate font-medium text-foreground">{entry.label}</span>
                <span className="shrink-0 font-semibold text-foreground">{entry.pct.toFixed(1)}%</span>
              </div>
              <AllocationBar
                percentage={entry.pct}
                color={CHART_SEQUENCE[index % CHART_SEQUENCE.length]}
                delay={index * 0.04}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConcentrationBarChart({
  title,
  entries,
  delay,
}: {
  title: string;
  entries: ConcentrationEntry[];
  delay: number;
}) {
  const data = entries.slice(0, 6).map((e) => ({ type: e.label, value: e.value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="rounded-xl border border-border bg-muted/40 p-4"
    >
      <p className="mb-3 text-label font-bold uppercase text-card-beige-muted-foreground">{title}</p>
      {data.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">Sem dados suficientes.</p>
      ) : (
        <ValueByTypeBarChart data={data} />
      )}
    </motion.div>
  );
}

export function InvestmentsConcentrationSection({ holdings }: { holdings: HoldingDetail[] }) {
  const concentration = useMemo(() => computeConcentration(holdings), [holdings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="card-premium rounded-2xl p-5 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h2 font-bold text-foreground">Concentração</h3>
        {concentration.topPosition ? (
          <span className="text-sm font-semibold text-card-beige-muted-foreground">
            Maior posição: <span className="text-foreground">{concentration.topPosition.label}</span> ·{" "}
            {formatCurrencyBRL(concentration.topPosition.value)} ({concentration.topPosition.pct.toFixed(1)}%)
          </span>
        ) : null}
      </div>

      <ConcentrationList title="Por classe de ativo" entries={concentration.byClass} />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ConcentrationBarChart title="Por instituição (R$)" entries={concentration.byInstitution} delay={0} />
        <ConcentrationBarChart title="Por cliente (R$)" entries={concentration.byClient} delay={0.08} />
      </div>
    </motion.div>
  );
}
