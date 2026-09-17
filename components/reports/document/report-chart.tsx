"use client";

import {
  Area,
  AreaChart,
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
import type { ReportChart, ReportChartFormat } from "@/lib/reports/types";

/**
 * Renderiza um gráfico do relatório. A escolha do tipo já foi feita pelo
 * builder, a partir do que o dado É — evolução vira linha, comparação
 * vira barra, ranking vira barra horizontal, composição vira donut.
 * Aqui só se desenha.
 *
 * Os gráficos são grandes de propósito: um relatório executivo com
 * gráfico apertado não é lido, é folheado.
 */

function formatValue(value: number, format: ReportChartFormat = "currency"): string {
  if (format === "percent") return `${value}%`;
  if (format === "number") return new Intl.NumberFormat("pt-BR").format(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Eixo: versão curta, para o rótulo não invadir a área do gráfico. */
function formatAxis(value: number, format: ReportChartFormat = "currency"): string {
  if (format === "percent") return `${value}%`;
  if (format === "number") return new Intl.NumberFormat("pt-BR").format(value);
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} mil`;
  return new Intl.NumberFormat("pt-BR").format(value);
}

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-card-lg)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const AXIS_TICK = { fill: "var(--card-beige-muted-foreground)", fontSize: 11 };

export function ReportChartView({ chart }: { chart: ReportChart }) {
  const format = chart.format ?? "currency";
  const data = chart.data;

  if (data.length === 0) {
    return (
      <p className="text-body-sm text-card-beige-muted-foreground">
        Sem dados suficientes para montar este gráfico.
      </p>
    );
  }

  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgba(46, 204, 155, 0.08)" }}
      contentStyle={TOOLTIP_STYLE}
      formatter={(value) => formatValue(Number(value), format)}
    />
  );

  if (chart.kind === "line") {
    return (
      <div className="h-[300px] w-full min-w-0 print:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={64}
              tickFormatter={(v: number) => formatAxis(Number(v), format)}
            />
            {tooltip}
            <Area
              type="monotone"
              dataKey="value"
              name="Valor"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill={`url(#grad-${chart.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.kind === "bar") {
    return (
      <div className="h-[280px] w-full min-w-0 print:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={64}
              allowDecimals={false}
              tickFormatter={(v: number) => formatAxis(Number(v), format)}
            />
            {tooltip}
            <Bar dataKey="value" name="Valor" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.kind === "bar-horizontal") {
    // Altura proporcional ao número de barras: ranking espremido em
    // altura fixa vira tarja ilegível a partir de ~6 itens.
    const height = Math.max(200, data.length * 38 + 40);
    return (
      <div className="w-full min-w-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              allowDecimals={false}
              tickFormatter={(v: number) => formatAxis(Number(v), format)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={150}
              tick={{ ...AXIS_TICK, fontSize: 12 }}
            />
            {tooltip}
            <Bar dataKey="value" name="Valor" fill="var(--accent)" radius={[0, 6, 6, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // donut — composição. A legenda ao lado carrega valor e participação,
  // porque fatia sem número não é informação financeira.
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = data.map((_, i) => CHART_SEQUENCE[i % CHART_SEQUENCE.length]);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:items-center">
      <div className="relative h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={94}
              paddingAngle={2}
              stroke="var(--card-beige)"
              strokeWidth={3}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatValue(Number(v), format)} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-card-beige-muted-foreground">
              Total
            </p>
            <p className="mt-1 font-heading text-base font-bold tracking-[-0.04em] text-foreground">
              {formatAxis(total, format)}
            </p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 space-y-1">
        {data.map((entry, index) => (
          <li
            key={entry.label}
            className="flex min-h-[34px] items-center justify-between gap-3 border-b border-border/60 last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <span className="truncate text-body-sm font-medium text-card-beige-muted-foreground">
                {entry.label}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-body-sm font-bold text-foreground">
                {formatValue(entry.value, format)}
              </span>
              {total > 0 ? (
                <span className="block text-caption text-card-beige-muted-foreground">
                  {((entry.value / total) * 100).toFixed(1).replace(".", ",")}%
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
