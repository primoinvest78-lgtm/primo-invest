"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrencyBRL } from "@/lib/utils/format";

export function TopClientsBarChart({
  data,
  onSelect,
}: {
  data: { name: string; total: number }[];
  /** Clicar numa barra abre o registro correspondente (índice em `data`). */
  onSelect?: (index: number) => void;
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={110}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 12 }}
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
          <Bar dataKey="total" fill="var(--primary)" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill="var(--primary)"
                onClick={onSelect ? () => onSelect(index) : undefined}
                style={onSelect ? { cursor: "pointer" } : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
