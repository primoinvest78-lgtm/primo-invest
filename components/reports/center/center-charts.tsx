"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import type { ReportListItem } from "@/lib/data/reports";
import { REPORT_TYPE_LABEL } from "@/lib/reports/types";
import { formatMonthLabel } from "@/lib/utils/format";

/**
 * Gráficos do próprio Report Center — sobre a operação de emissão, não
 * sobre patrimônio. Respondem duas perguntas de gestão: quanto estamos
 * emitindo ao longo do tempo, e de que tipo.
 *
 * Só aparecem quando há comparação real a fazer. Um gráfico de barras
 * com uma barra só não informa nada — vira enfeite.
 */

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-card-lg)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const AXIS_TICK = { fill: "var(--card-beige-muted-foreground)", fontSize: 11 };

export function CenterCharts({ reports }: { reports: ReportListItem[] }) {
  const generated = reports.filter((r) => r.status === "gerado");

  const byMonth = new Map<string, number>();
  for (const r of generated) {
    const key = r.createdAt.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const monthly = Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-12)
    .map(([month, total]) => ({ label: formatMonthLabel(month), total }));

  const byType = new Map<string, number>();
  for (const r of generated) {
    const label = REPORT_TYPE_LABEL[r.type];
    byType.set(label, (byType.get(label) ?? 0) + 1);
  }
  const types = Array.from(byType.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);

  if (monthly.length < 2 && types.length < 2) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {monthly.length >= 2 ? (
        <section className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Volume</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Emissões por mês</h3>
          <div className="mt-4 h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: -18, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="total"
                  name="Relatórios"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {types.length >= 2 ? (
        <section className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Composição
          </p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Emissões por tipo</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:items-center">
            <div className="h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={types}
                    dataKey="total"
                    nameKey="label"
                    innerRadius={54}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="var(--card-beige)"
                    strokeWidth={3}
                  >
                    {types.map((entry, index) => (
                      <Cell key={entry.label} fill={CHART_SEQUENCE[index % CHART_SEQUENCE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="min-w-0 space-y-1">
              {types.map((entry, index) => (
                <li
                  key={entry.label}
                  className="flex min-h-[32px] items-center justify-between gap-3 border-b border-border/60 last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_SEQUENCE[index % CHART_SEQUENCE.length] }}
                    />
                    <span className="truncate text-body-sm font-medium text-card-beige-muted-foreground">
                      {entry.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-body-sm font-bold text-foreground">{entry.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
