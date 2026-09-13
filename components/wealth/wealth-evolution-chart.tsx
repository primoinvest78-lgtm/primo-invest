"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { WealthHistoryPoint } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function WealthEvolutionChart({ data }: { data: WealthHistoryPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="wealthOverviewArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 12 }}
            dy={8}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />

          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.18, strokeDasharray: "4 4" }}
            formatter={(value) => [formatCurrencyBRL(Number(value)), "Patrimônio"]}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card-lg)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)", fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: "var(--popover-foreground)", fontWeight: 700 }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={3}
            fill="url(#wealthOverviewArea)"
            activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--card-beige)", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
