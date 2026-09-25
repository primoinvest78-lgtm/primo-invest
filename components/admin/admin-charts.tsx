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
import { ROLE_LABEL, type AppRole } from "@/lib/admin/roles";
import { PanelAction } from "@/components/ui/panel-action";
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

/**
 * Gráficos administrativos — só aparecem com pelo menos 2 pontos de
 * comparação real, mesma regra dos demais módulos. Nada decorativo.
 */
export function AdminCharts({
  countsByRole,
  activityTrend,
  byModule,
  onGoToTab,
}: {
  countsByRole: { role: AppRole; total: number }[];
  activityTrend: { day: string; total: number }[];
  byModule: { module: string; total: number }[];
  /** Abre a aba correspondente da Administração. */
  onGoToTab?: (tab: string) => void;
}) {
  const roleData = countsByRole
    .filter((r) => r.total > 0)
    .map((r) => ({ label: ROLE_LABEL[r.role], value: r.total }));

  const moduleData = byModule.slice(0, 8).map((m) => ({ label: m.module, total: m.total }));
  const trendData = activityTrend.slice(-14).map((p) => ({ label: formatDate(p.day), total: p.total }));

  const showRoles = roleData.length >= 2;
  const showModules = moduleData.filter((m) => m.total > 0).length >= 2;
  const showTrend = trendData.filter((t) => t.total > 0).length >= 2;

  if (!showRoles && !showModules && !showTrend) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {showRoles ? (
        <section className="card-premium relative rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Composição</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Usuários por perfil</h3>
          {onGoToTab ? (
            <div className="absolute right-4 top-4">
              <PanelAction onClick={() => onGoToTab("usuarios")}>Ver usuários</PanelAction>
            </div>
          ) : null}
          <DonutMini data={roleData} />
        </section>
      ) : null}

      {showTrend ? (
        <section className="card-premium relative rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Volume</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Atividade por dia — 14 dias</h3>
          {onGoToTab ? (
            <div className="absolute right-4 top-4">
              <PanelAction onClick={() => onGoToTab("auditoria")}>Ver auditoria</PanelAction>
            </div>
          ) : null}
          <div className="mt-4 h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ left: -18, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="total" name="Eventos" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {showModules ? (
        <section className="card-premium relative rounded-2xl p-5 lg:col-span-2">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Distribuição</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Eventos administrativos por módulo</h3>
          {onGoToTab ? (
            <div className="absolute right-4 top-4">
              <PanelAction onClick={() => onGoToTab("auditoria")}>Ver auditoria</PanelAction>
            </div>
          ) : null}
          <div className="mt-4 h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={110} tick={{ ...AXIS_TICK, fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="total" name="Eventos" fill="var(--accent)" radius={[0, 6, 6, 0]} maxBarSize={22} />
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
