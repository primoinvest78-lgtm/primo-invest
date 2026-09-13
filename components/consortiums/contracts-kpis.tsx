"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import { contractOutstandingBalance } from "@/lib/utils/consortium-helpers";
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
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-premium rounded-2xl p-4 transition-all duration-200"
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.div>
  );
}

export function ContractsKpis({ contracts }: { contracts: ConsortiumContract[] }) {
  const active = contracts.filter((c) => c.status === "active" || c.status === "in_use");
  const delinquent = contracts.filter((c) => c.status === "delinquent");
  const totalCredit = active.reduce((sum, c) => sum + Number(c.creditAmount ?? 0), 0);
  const totalOutstanding = contracts.reduce((sum, c) => sum + (contractOutstandingBalance(c) ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Kpi label="Contratos" value={String(contracts.length)} index={0} />
      <Kpi label="Ativos" value={String(active.length)} index={1} />
      <Kpi
        label="Inadimplentes"
        value={String(delinquent.length)}
        valueClassName={delinquent.length > 0 ? "text-destructive" : "text-foreground"}
        animate={false}
        index={2}
      />
      <Kpi label="Crédito ativo" value={formatCurrencyBRL(totalCredit)} index={3} />
      <Kpi label="Saldo devedor total" value={formatCurrencyBRL(totalOutstanding)} valueClassName="text-destructive" index={4} />
    </div>
  );
}
