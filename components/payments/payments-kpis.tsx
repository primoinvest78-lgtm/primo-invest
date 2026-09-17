"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { PaymentDashboardData } from "@/lib/data/payments";
import { formatCurrencyBRL } from "@/lib/utils/format";

function Kpi({
  label,
  value,
  valueClassName,
  index,
}: {
  label: string;
  value: string;
  valueClassName?: string;
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
        <AnimatedNumber value={value} />
      </p>
    </motion.div>
  );
}

export function PaymentsKpis({ data }: { data: PaymentDashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Recebidos" value={String(data.received)} index={0} />
      <Kpi label="Conciliados" value={String(data.reconciled)} valueClassName="text-primary" index={1} />
      <Kpi
        label="Aguardando revisão"
        value={String(data.awaitingReview)}
        valueClassName={data.awaitingReview > 0 ? "text-warning" : "text-foreground"}
        index={2}
      />
      <Kpi
        label="Exceções"
        value={String(data.exceptions)}
        valueClassName={data.exceptions > 0 ? "text-destructive" : "text-foreground"}
        index={3}
      />
      <Kpi label="Valor conciliado" value={formatCurrencyBRL(data.reconciledAmount)} index={4} />
      <Kpi label="Taxa de automação" value={`${data.automationRate}%`} index={5} />
    </div>
  );
}
