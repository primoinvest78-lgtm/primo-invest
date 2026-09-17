"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { LiabilityDetail } from "@/lib/data/wealth";
import {
  computeLiabilitiesNeedingAttention,
  countLiabilitiesNearMaturity,
} from "@/lib/utils/liability-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

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

export function LiabilitiesKpis({
  liabilities,
  netWorth,
  onSelectAttention,
  onSelectNearMaturity,
}: {
  liabilities: LiabilityDetail[];
  netWorth: number;
  onSelectAttention?: () => void;
  onSelectNearMaturity?: () => void;
}) {
  const totalOutstanding = liabilities.reduce((sum, l) => sum + Number(l.outstandingAmount ?? 0), 0);
  const totalMonthly = liabilities.reduce((sum, l) => sum + Number(l.monthlyPayment ?? 0), 0);
  const attentionCount = computeLiabilitiesNeedingAttention(liabilities).size;
  const nearMaturityCount = countLiabilitiesNearMaturity(liabilities);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi
        label="Total de passivos"
        value={formatCurrencyBRL(totalOutstanding)}
        valueClassName="text-destructive"
        index={0}
      />
      <Kpi label="Patrimônio líquido" value={formatCurrencyBRL(netWorth)} index={1} />
      <Kpi label="Parcela mensal total" value={formatCurrencyBRL(totalMonthly)} index={2} />
      <Kpi label="Passivos" value={String(liabilities.length)} index={3} />
      <Kpi
        label="Em atenção"
        value={String(attentionCount)}
        valueClassName={attentionCount > 0 ? "text-destructive" : "text-primary"}
        animate={false}
        index={4}
        onClick={onSelectAttention}
      />
      <Kpi
        label="Próximos do vencimento"
        value={String(nearMaturityCount)}
        animate={false}
        index={5}
        onClick={onSelectNearMaturity}
      />
    </div>
  );
}
