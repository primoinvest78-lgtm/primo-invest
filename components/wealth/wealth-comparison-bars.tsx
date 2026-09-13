"use client";

import { motion } from "motion/react";

import type { WealthOverview } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";

function ComparisonBar({
  label,
  value,
  max,
  colorClassName,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  colorClassName: string;
  delay: number;
}) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-bold text-foreground">{formatCurrencyBRL(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay }}
          className={["h-full rounded-full", colorClassName].join(" ")}
        />
      </div>
    </div>
  );
}

export function WealthComparisonBars({ overview }: { overview: WealthOverview }) {
  const max = Math.max(overview.totalAssets, overview.totalLiabilities, Math.abs(overview.netWorth), 1);

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-h2 font-bold text-foreground">Ativos, passivos e patrimônio líquido</h3>
      <p className="mb-5 text-sm text-card-beige-muted-foreground">
        Ativos − Passivos = Patrimônio líquido
      </p>

      <div className="space-y-4">
        <ComparisonBar label="Ativos" value={overview.totalAssets} max={max} colorClassName="bg-accent" delay={0} />
        <ComparisonBar
          label="Passivos"
          value={overview.totalLiabilities}
          max={max}
          colorClassName="bg-destructive"
          delay={0.08}
        />
        <ComparisonBar
          label="Patrimônio líquido"
          value={overview.netWorth}
          max={max}
          colorClassName="bg-primary"
          delay={0.16}
        />
      </div>
    </div>
  );
}
