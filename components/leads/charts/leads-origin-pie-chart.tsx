"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export function LeadsOriginPieChart({ data, onSelect }: { data: { source: string; count: number }[]; onSelect?: (source: string) => void }) {
  const colors = data.map((_, index) => CHART_SEQUENCE[index % CHART_SEQUENCE.length]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-[200px] w-full sm:w-[200px] sm:shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="source"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="var(--card-beige)"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.source}
                  fill={colors[index]}
                  onClick={onSelect ? () => onSelect(entry.source) : undefined}
                  style={onSelect ? { cursor: "pointer" } : undefined}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => [String(value), item?.payload?.source ?? ""]}
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

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {data.map((entry, index) => (
          <div key={entry.source} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <span className="truncate font-medium text-foreground">{entry.source}</span>
            </div>
            <span className="shrink-0 font-bold text-card-beige-muted-foreground">
              {entry.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
