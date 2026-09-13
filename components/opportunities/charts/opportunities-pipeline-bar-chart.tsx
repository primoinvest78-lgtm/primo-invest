"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function OpportunitiesPipelineBarChart({ data }: { data: { stage: string; value: number }[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="stage"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(46, 204, 155, 0.08)" }}
            formatter={(value) => formatCurrencyBRL(Number(value))}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card-lg)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={entry.stage} fill={CHART_SEQUENCE[index % CHART_SEQUENCE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
