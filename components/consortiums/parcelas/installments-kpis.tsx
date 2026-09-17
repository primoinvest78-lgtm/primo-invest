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
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.button>
  );
}

export function InstallmentsKpis({
  installments,
  onSelectStatus,
}: {
  installments: ConsortiumInstallment[];
  /** Clicar num KPI filtra a lista de parcelas abaixo pelo mesmo status. */
  onSelectStatus?: (status: string) => void;
}) {
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
      <Kpi
        label="Parcelas pagas"
        value={String(paid.length)}
        animate={false}
        index={2}
        onClick={onSelectStatus ? () => onSelectStatus("paid") : undefined}
      />
      <Kpi
        label="Parcelas abertas"
        value={String(open.length)}
        animate={false}
        index={3}
        onClick={onSelectStatus ? () => onSelectStatus("pending") : undefined}
      />
      <Kpi
        label="Parcelas atrasadas"
        value={String(overdue.length)}
        valueClassName={overdue.length > 0 ? "text-destructive" : "text-foreground"}
        animate={false}
        index={4}
        onClick={onSelectStatus ? () => onSelectStatus("overdue") : undefined}
      />
      <Kpi label="% pago" value={`${pctPaid.toFixed(0)}%`} animate={false} index={5} />
    </div>
  );
}
