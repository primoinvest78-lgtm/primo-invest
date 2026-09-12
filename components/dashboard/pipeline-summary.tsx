"use client";

import type { PipelineStage } from "@/lib/mock/dashboard";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export function PipelineSummary({ stages }: { stages: PipelineStage[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="mb-5">
        <p className="text-label font-bold uppercase text-muted-foreground">Comercial</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Pipeline comercial</h3>
      </div>

      <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
        {stages.map((stage, index) => {
          const accent = CHART_SEQUENCE[index % CHART_SEQUENCE.length];

          return (
            <div key={stage.name} className="min-w-[130px] flex-1">
              <div className="mb-3 flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-ring-primary-md"
                  style={{ backgroundColor: accent }}
                />
                <span className="truncate text-[11px] font-semibold text-muted-foreground">
                  {stage.name}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-muted/60 p-3.5 transition-colors duration-150 hover:border-primary/40 hover:bg-muted">
                <div className="text-label font-bold uppercase text-muted-foreground">
                  Valor
                </div>
                <div className="mt-2 truncate text-sm font-bold text-foreground">
                  {stage.value}
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="mt-3 flex items-center px-1">
                  <div className="h-px w-full bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
