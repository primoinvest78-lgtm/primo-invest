"use client";

import { useMemo, useState } from "react";

import { WealthEvolutionChart } from "@/components/wealth/wealth-evolution-chart";
import type { WealthHistoryPoint } from "@/lib/data/wealth";
import { availableWealthPeriods, filterWealthHistoryByPeriod, type WealthPeriodValue } from "@/lib/utils/wealth-period";

export function WealthEvolutionSection({ history }: { history: WealthHistoryPoint[] }) {
  const periods = useMemo(() => availableWealthPeriods(history), [history]);
  const [period, setPeriod] = useState<WealthPeriodValue>("all");

  const filtered = useMemo(() => filterWealthHistoryByPeriod(history, period), [history, period]);

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h2 font-bold text-foreground">Evolução patrimonial</h3>
        {periods.length > 1 ? (
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {p.value === "all" ? "Tudo" : p.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {history.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Sem transações suficientes registradas pra montar a evolução patrimonial ao longo do tempo.
        </p>
      ) : (
        <WealthEvolutionChart data={filtered} />
      )}
    </div>
  );
}
