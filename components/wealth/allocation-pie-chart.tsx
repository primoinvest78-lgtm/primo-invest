"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function AllocationPieChart({
  data,
}: {
  data: { productType: string; value: number }[];
}) {
  const colors = data.map((_, index) => CHART_SEQUENCE[index % CHART_SEQUENCE.length]);

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="productType"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--card-beige)"
            strokeWidth={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.productType} fill={colors[index]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
