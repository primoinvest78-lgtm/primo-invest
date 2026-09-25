"use client";

import { motion } from "motion/react";

import { PanelAction } from "@/components/ui/panel-action";
import type { ConsortiumInstallment } from "@/lib/data/consortiums";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function InstallmentsProgressSection({ installments }: { installments: ConsortiumInstallment[] }) {
  const paid = installments.filter((i) => i.status === "paid");
  const totalPaid = paid.reduce((sum, i) => sum + Number(i.paidAmount ?? i.amount ?? 0), 0);
  const outstanding = installments
    .filter((i) => i.status !== "paid" && i.status !== "exempt" && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
  const total = totalPaid + outstanding;
  const pct = total > 0 ? (totalPaid / total) * 100 : 0;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-h2 font-bold text-foreground">Progresso financeiro</h3>
        <PanelAction href="/consorcios/contratos">Ver contratos</PanelAction>
      </div>
      <p className="mb-4 text-sm text-card-beige-muted-foreground">Total pago × saldo restante</p>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <span className="text-2xl font-bold text-primary">{formatCurrencyBRL(totalPaid)}</span>
        <span className="text-sm font-semibold text-card-beige-muted-foreground">
          restam {formatCurrencyBRL(outstanding)}
        </span>
      </div>

      <div className="h-5 overflow-hidden rounded-full bg-black/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-primary"
        />
      </div>
      <p className="mt-1.5 text-xs font-bold text-card-beige-muted-foreground">{pct.toFixed(0)}% pago</p>
    </div>
  );
}
