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
import type { IntegrationRow, SyncRun } from "@/lib/data/integrations";
import { integrationStatusLabel } from "@/lib/integrations/catalog";
import { formatMonthLabel } from "@/lib/utils/format";

/**
 * Gráficos do dashboard de integrações. Cada um só aparece quando há
 * pelo menos 2 pontos de comparação real — gráfico com 1 barra ou 1
 * fatia não informa nada, vira enfeite.
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

export function CenterCharts({
  integrations,
  syncRuns,
}: {
  integrations: IntegrationRow[];
  syncRuns: SyncRun[];
}) {
  const byMonth = new Map<string, number>();
  for (const run of syncRuns) {
    const key = run.startedAt.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const monthly = Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-12)
    .map(([month, total]) => ({ label: formatMonthLabel(month), total }));

  const successRuns = syncRuns.filter((r) => r.status === "completed").length;
  const errorRuns = syncRuns.filter((r) => r.status === "failed").length;
  const successVsError = [
    { label: "Sucesso", value: successRuns },
    { label: "Erro", value: errorRuns },
  ].filter((d) => d.value > 0);

  const byStatus = new Map<string, number>();
  for (const i of integrations) bump(byStatus, integrationStatusLabel(i.status));
  const statusData = Array.from(byStatus.entries())
    .map(([label, total]) => ({ label, total }))
    .filter((d) => d.total > 0);

  const showMonthly = monthly.length >= 2;
  const showSuccessVsError = successVsError.length >= 2;
  const showStatus = statusData.length >= 2;

  if (!showMonthly && !showSuccessVsError && !showStatus) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {showMonthly ? (
        <section className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Volume</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Sincronizações por período</h3>
          <div className="mt-4 h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: -18, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="total" name="Execuções" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {showSuccessVsError ? (
        <section className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Qualidade</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Sucesso × erro</h3>
          <DonutMini data={successVsError} />
        </section>
      ) : null}

      {showStatus ? (
        <section className="card-premium rounded-2xl p-5 lg:col-span-2">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Cadastro</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Distribuição por status</h3>
          <div className="mt-4 h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={130} tick={{ ...AXIS_TICK, fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="total" name="Integrações" fill="var(--accent)" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function DonutMini({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = data.map((_, i) => CHART_SEQUENCE[i % CHART_SEQUENCE.length]);

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)] sm:items-center">
      <div className="h-[160px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={44}
              outerRadius={68}
              paddingAngle={2}
              stroke="var(--card-beige)"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 space-y-1">
        {data.map((entry, index) => (
          <li
            key={entry.label}
            className="flex min-h-[32px] items-center justify-between gap-3 border-b border-border/60 last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index] }} />
              <span className="truncate text-body-sm font-medium text-card-beige-muted-foreground">
                {entry.label}
              </span>
            </span>
            <span className="shrink-0 text-body-sm font-bold text-foreground">
              {entry.value}
              {total > 0 ? (
                <span className="ml-1 text-caption text-card-beige-muted-foreground">
                  ({((entry.value / total) * 100).toFixed(0)}%)
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
