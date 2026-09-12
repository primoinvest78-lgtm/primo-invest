"use client";

import type { AttentionItem } from "@/lib/mock/dashboard";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="mb-2">
          <p className="text-label font-bold uppercase text-muted-foreground">Atenção</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">
            O que precisa da sua atenção
          </h3>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Nenhum item pendente no momento.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="mb-5">
        <p className="text-label font-bold uppercase text-muted-foreground">Atenção</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">
          O que precisa da sua atenção
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          const accent = CHART_SEQUENCE[index % CHART_SEQUENCE.length];

          return (
            <article
              key={item.description}
              className="group flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-3.5 transition-all duration-150 hover:border-primary/40 hover:bg-muted"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background"
                style={{ color: accent }}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-foreground">
                  {item.description}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-label font-bold uppercase text-muted-foreground">
                    Prioridade {item.priority}
                  </span>

                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground">
                    {item.quantity}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
