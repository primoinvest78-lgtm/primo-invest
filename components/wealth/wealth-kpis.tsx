"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { WealthHistoryPoint, WealthOverview } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";

function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
  index,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-premium rounded-2xl p-5 transition-all duration-200"
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-3 truncate text-h2 font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.div>
  );
}

export function WealthKpis({
  overview,
  history,
}: {
  overview: WealthOverview;
  history: WealthHistoryPoint[];
}) {
  let variation: number | null = null;
  if (history.length >= 2) {
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (prev.value !== 0) variation = ((last.value - prev.value) / Math.abs(prev.value)) * 100;
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Patrimônio total" value={formatCurrencyBRL(overview.totalAssets)} index={0} />
      <Kpi
        label="Patrimônio líquido"
        value={formatCurrencyBRL(overview.netWorth)}
        valueClassName="text-primary"
        index={1}
      />
      <Kpi label="Investimentos" value={formatCurrencyBRL(overview.investmentsTotal)} index={2} />
      <Kpi label="Liquidez" value={formatCurrencyBRL(overview.liquidTotal)} index={3} />
      <Kpi
        label="Passivos"
        value={formatCurrencyBRL(overview.totalLiabilities)}
        valueClassName="text-destructive"
        index={4}
      />
      <Kpi
        label="Variação patrimonial"
        value={variation === null ? "—" : `${variation >= 0 ? "+" : ""}${variation.toFixed(1)}%`}
        valueClassName={variation !== null && variation < 0 ? "text-destructive" : "text-primary"}
        animate={false}
        index={5}
      />
    </div>
  );
}
