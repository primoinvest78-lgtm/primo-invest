"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WealthPoint } from "@/lib/mock/dashboard";

export function WealthChart({ data }: { data: WealthPoint[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="mb-6 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-muted-foreground">
            Patrimônio
          </p>

          <h3 className="mt-1 truncate text-h2 font-bold text-foreground">
            Patrimônio sob gestão
          </h3>
        </div>

        <p className="shrink-0 text-body-sm text-muted-foreground">
          Evolução nos últimos 12 meses
        </p>
      </div>

      <div className="h-[330px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="primoWealthArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              dy={10}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(value: number) => `R$ ${Math.round(value / 1000000)}M`}
            />

            <Tooltip
              cursor={{ stroke: "var(--primary)", strokeOpacity: 0.18, strokeDasharray: "4 4" }}
              formatter={(
                value: string | number | readonly (string | number)[] | undefined,
              ) => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : Number(
                        String(Array.isArray(value) ? value[0] : value ?? 0).replace(
                          /[^0-9.-]/g,
                          "",
                        ),
                      ) || 0;

                return [
                  `R$ ${new Intl.NumberFormat("pt-BR").format(numericValue)}`,
                  "Patrimônio",
                ];
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: 14,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card-lg)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
              labelStyle={{
                color: "var(--muted-foreground)",
                fontWeight: 600,
                marginBottom: 4,
              }}
              itemStyle={{ color: "var(--popover-foreground)", fontWeight: 700 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="url(#primoWealthArea)"
              activeDot={{
                r: 6,
                fill: "var(--primary)",
                stroke: "var(--card)",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-ring-primary-lg" />
        <span className="text-[11px] font-semibold text-muted-foreground">
          Evolução do patrimônio
        </span>
      </div>
    </section>
  );
}
