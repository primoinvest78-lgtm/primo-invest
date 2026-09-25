"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import type { TabKey } from "@/components/payments/evidence-queue";
import type { PaymentDashboardData } from "@/lib/data/payments";

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-card-lg)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

/** Composição por status — só aparece com pelo menos 2 categorias reais. */
export function PaymentsCharts({ data, onSelectTab }: { data: PaymentDashboardData; onSelectTab?: (tab: TabKey) => void }) {
  const chartData: { label: string; value: number; tab: TabKey }[] = [
    { label: "Conciliados", value: data.reconciled, tab: "conciliados" as TabKey },
    { label: "Aguardando revisão", value: data.awaitingReview, tab: "revisao" as TabKey },
    { label: "Exceções", value: data.exceptions, tab: "excecoes" as TabKey },
    { label: "Duplicidades", value: data.duplicates, tab: "duplicidades" as TabKey },
  ].filter((d) => d.value > 0);

  if (chartData.length < 2) return null;

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const colors = chartData.map((_, i) => CHART_SEQUENCE[i % CHART_SEQUENCE.length]);

  return (
    <section className="card-premium rounded-2xl p-5">
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Composição</p>
      <h3 className="mt-1 text-h2 font-bold text-foreground">Comprovantes por status</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)] sm:items-center">
        <div className="h-[160px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={44} outerRadius={68} paddingAngle={2} stroke="var(--card-beige)" strokeWidth={3}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.label}
                    fill={colors[index]}
                    onClick={onSelectTab ? () => onSelectTab(entry.tab) : undefined}
                    style={onSelectTab ? { cursor: "pointer" } : undefined}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 space-y-1">
          {chartData.map((entry, index) => (
            <li
              key={entry.label}
              onClick={onSelectTab ? () => onSelectTab(entry.tab) : undefined}
              className={`flex min-h-[32px] items-center justify-between gap-3 border-b border-border/60 last:border-b-0 ${onSelectTab ? "cursor-pointer rounded-md px-1 transition-colors hover:bg-primary/10" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="truncate text-body-sm font-medium text-card-beige-muted-foreground">{entry.label}</span>
              </span>
              <span className="shrink-0 text-body-sm font-bold text-foreground">
                {entry.value}
                <span className="ml-1 text-caption text-card-beige-muted-foreground">({((entry.value / total) * 100).toFixed(0)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
