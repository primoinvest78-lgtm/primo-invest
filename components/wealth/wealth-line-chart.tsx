"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrencyBRL } from "@/lib/utils/format";

export function WealthLineChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="clientWealthArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            formatter={(value) => formatCurrencyBRL(Number(value))}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card-lg)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={3}
            fill="url(#clientWealthArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
