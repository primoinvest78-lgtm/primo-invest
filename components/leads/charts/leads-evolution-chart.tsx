"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export type LeadsEvolutionPoint = { month: string; novos: number; convertidos: number };

export function LeadsEvolutionChart({ data }: { data: LeadsEvolutionPoint[] }) {
  return (
    <div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
              allowDecimals={false}
              tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card-lg)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
            />
            <Line
              type="monotone"
              dataKey="novos"
              name="Leads captados"
              stroke={CHART_SEQUENCE[0]}
              strokeWidth={3}
              dot={{ r: 3, fill: CHART_SEQUENCE[0] }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="convertidos"
              name="Convertidos"
              stroke={CHART_SEQUENCE[1]}
              strokeWidth={3}
              dot={{ r: 3, fill: CHART_SEQUENCE[1] }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: CHART_SEQUENCE[0] }}
          />
          <span className="text-[11px] font-semibold text-card-beige-muted-foreground">
            Leads captados
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: CHART_SEQUENCE[1] }}
          />
          <span className="text-[11px] font-semibold text-card-beige-muted-foreground">
            Convertidos
          </span>
        </div>
      </div>
    </div>
  );
}
