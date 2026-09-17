"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { HoldingDetail, WealthHistoryPoint } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { computeGainLoss, holdingCost, isLiquidHolding } from "@/lib/utils/investment-helpers";

function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
  index,
  onClick,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
  index: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={[
        "card-premium rounded-2xl p-4 text-left transition-all duration-200",
        onClick ? "cursor-pointer hover:border-primary/60 hover:shadow-card" : "",
      ].join(" ")}
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.button>
  );
}

export function InvestmentsKpis({
  holdings,
  history,
  onSelectAll,
  onSelectLiquid,
}: {
  holdings: HoldingDetail[];
  history: WealthHistoryPoint[];
  onSelectAll?: () => void;
  onSelectLiquid?: () => void;
}) {
  const invested = holdings.reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);
  const liquidTotal = holdings.filter(isLiquidHolding).reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);

  let totalCost = 0;
  let totalGain = 0;
  let hasCostData = false;
  for (const h of holdings) {
    const cost = holdingCost(h);
    if (cost === null) continue;
    hasCostData = true;
    totalCost += cost;
    const { gainLoss } = computeGainLoss(h);
    totalGain += gainLoss ?? 0;
  }
  const rentabilidade = hasCostData && totalCost > 0 ? (totalGain / totalCost) * 100 : null;

  let variation: number | null = null;
  if (history.length >= 2) {
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (prev.value !== 0) variation = ((last.value - prev.value) / Math.abs(prev.value)) * 100;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Valor investido" value={formatCurrencyBRL(invested)} index={0} />
      <Kpi
        label="Rentabilidade"
        value={rentabilidade === null ? "—" : `${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(1)}%`}
        valueClassName={rentabilidade !== null && rentabilidade < 0 ? "text-destructive" : "text-primary"}
        animate={false}
        index={1}
      />
      <Kpi
        label="Resultado financeiro"
        value={hasCostData ? formatCurrencyBRL(totalGain) : "—"}
        valueClassName={hasCostData && totalGain < 0 ? "text-destructive" : "text-primary"}
        index={2}
      />
      <Kpi label="Quantidade" value={String(holdings.length)} index={3} onClick={onSelectAll} />
      <Kpi label="Liquidez" value={formatCurrencyBRL(liquidTotal)} index={4} onClick={onSelectLiquid} />
      <Kpi
        label="Variação no período"
        value={variation === null ? "—" : `${variation >= 0 ? "+" : ""}${variation.toFixed(1)}%`}
        valueClassName={variation !== null && variation < 0 ? "text-destructive" : "text-primary"}
        animate={false}
        index={5}
      />
    </div>
  );
}
