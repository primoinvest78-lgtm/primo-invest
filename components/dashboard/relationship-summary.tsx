"use client";

import Link from "next/link";

import type { RelationshipSummaryData } from "@/lib/mock/dashboard";

export function RelationshipSummary({
  items,
}: {
  items: (RelationshipSummaryData & { href: string })[];
}) {
  return (
    <section className="card-premium overflow-hidden rounded-2xl p-5 md:p-6">
      <div className="mb-5">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Relacionamento</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Indicadores</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-h-[54px] items-center justify-between gap-4 rounded-xl border border-border bg-muted/60 p-3.5 transition-colors duration-150 hover:border-primary/40 hover:bg-muted"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {item.label}
            </span>

            <span className="shrink-0 text-base font-bold tracking-[-0.02em] text-accent">
              {item.value}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
