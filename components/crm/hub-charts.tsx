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
import type { CrmActivityPoint } from "@/lib/data/crm";
import type { CrmSignalBundle } from "@/lib/crm/signals";
import { formatDate } from "@/lib/utils/format";

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-card-lg)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const AXIS_TICK = { fill: "var(--card-beige-muted-foreground)", fontSize: 11 };

const KIND_LABEL: Record<string, string> = {
  lead: "Leads",
  opportunity: "Oportunidades",
  task: "Tarefas",
  client: "Clientes",
};

/**
 * Gráficos do hub — cada um só aparece com pelo menos 2 pontos de
 * comparação real, mesma regra do Centro de Integrações.
 */
export function HubCharts({ bundle, activity }: { bundle: CrmSignalBundle; activity: CrmActivityPoint[] }) {
  const byKind = Object.entries(bundle.countsByKind)
    .map(([kind, value]) => ({ label: KIND_LABEL[kind] ?? kind, value }))
    .filter((d) => d.value > 0);

  const activityData = activity.slice(-14).map((p) => ({
    label: formatDate(p.day),
    total: p.interactions + p.notes,
  }));

  const showByKind = byKind.length >= 2;
  const showActivity = activityData.filter((d) => d.total > 0).length >= 2;

  if (!showByKind && !showActivity) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {showByKind ? (
        <section className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Composição</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Sinais por tipo de registro</h3>
          <DonutMini data={byKind} />
        </section>
      ) : null}

      {showActivity ? (
        <section className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Engajamento</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Interações e notas — 14 dias</h3>
          <div className="mt-4 h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ left: -18, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="total" name="Registros" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </div>
  );
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
