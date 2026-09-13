"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { ConsortiumInstallment } from "@/lib/data/consortiums";
import { isEffectivelyOverdue } from "@/lib/utils/installment-helpers";
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

export function InstallmentsKpis({ installments }: { installments: ConsortiumInstallment[] }) {
  const paid = installments.filter((i) => i.status === "paid");
  const overdue = installments.filter(isEffectivelyOverdue);
  const open = installments.filter((i) => i.status === "pending" && !isEffectivelyOverdue(i));

  const totalPaid = paid.reduce((sum, i) => sum + Number(i.paidAmount ?? i.amount ?? 0), 0);
  const totalScheduled = installments.reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
  const outstanding = installments
    .filter((i) => i.status !== "paid" && i.status !== "exempt" && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
  const pctPaid = totalScheduled > 0 ? (totalPaid / totalScheduled) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total pago" value={formatCurrencyBRL(totalPaid)} index={0} />
      <Kpi label="Saldo devedor" value={formatCurrencyBRL(outstanding)} valueClassName="text-destructive" index={1} />
      <Kpi label="Parcelas pagas" value={String(paid.length)} animate={false} index={2} />
      <Kpi label="Parcelas abertas" value={String(open.length)} animate={false} index={3} />
      <Kpi
        label="Parcelas atrasadas"
        value={String(overdue.length)}
        valueClassName={overdue.length > 0 ? "text-destructive" : "text-foreground"}
        animate={false}
        index={4}
      />
      <Kpi label="% pago" value={`${pctPaid.toFixed(0)}%`} animate={false} index={5} />
    </div>
  );
}
