"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import type { AllocationItem } from "@/lib/mock/dashboard";
import { PanelAction } from "@/components/ui/panel-action";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export function AllocationChart({ data }: { data: AllocationItem[] }) {
  const chartColors = data.map((_, index) => CHART_SEQUENCE[index % CHART_SEQUENCE.length]);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="card-premium overflow-hidden rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Alocação</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Alocação patrimonial</h3>
        </div>
        <PanelAction href="/patrimonio/investimentos">Ver investimentos</PanelAction>
      </div>

      {data.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Sem posições registradas suficientes pra montar a alocação.
        </p>
      ) : (
        <>
      <div className="relative h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke="var(--card-beige)"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-card-beige-muted-foreground">
              Total
            </div>
            <div className="mt-1 font-heading text-xl font-bold tracking-[-0.04em] text-foreground">
              {total}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1 border-t border-border pt-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex min-h-[38px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-ring-primary-sm"
                style={{ backgroundColor: chartColors[index] }}
              />
              <span className="truncate text-sm font-medium text-card-beige-muted-foreground">
                {item.name}
              </span>
            </div>

            <span className="shrink-0 text-sm font-bold text-foreground">{item.value}%</span>
          </div>
        ))}
      </div>
        </>
      )}
    </section>
  );
}
