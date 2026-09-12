"use client";

import type { RecentActivityItem } from "@/lib/mock/dashboard";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="mb-2">
          <p className="text-label font-bold uppercase text-muted-foreground">Movimento</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Atividade recente</h3>
        </div>
        <p className="text-body-sm text-muted-foreground">Nenhuma atividade registrada.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="mb-5">
        <p className="text-label font-bold uppercase text-muted-foreground">Movimento</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Atividade recente</h3>
      </div>

      <div className="space-y-1">
        {items.map((item, index) => {
          const accent = CHART_SEQUENCE[index % CHART_SEQUENCE.length];

          return (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-xl px-2.5 py-3 transition-colors duration-150 hover:bg-muted/70"
            >
              <div className="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                <span className="absolute h-5 w-5 rounded-full bg-muted" />
                <span
                  className="relative h-2.5 w-2.5 rounded-full shadow-ring-primary-md"
                  style={{ backgroundColor: accent }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-foreground">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
