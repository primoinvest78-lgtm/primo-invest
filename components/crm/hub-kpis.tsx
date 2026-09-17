"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { CrmKpis } from "@/lib/crm/signals";
import { formatCurrencyBRL } from "@/lib/utils/format";

function Kpi({
  label,
  value,
  href,
  sub,
  valueClassName,
  index,
}: {
  label: string;
  value: string;
  href: string;
  sub?: string;
  valueClassName?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={href}
        className="card-premium block rounded-2xl p-4 transition-all duration-200 hover:border-primary/60 hover:shadow-card"
      >
        <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
          {label}
        </p>
        <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
          <AnimatedNumber value={value} />
        </p>
        {sub ? <p className="mt-1 truncate text-caption text-card-beige-muted-foreground">{sub}</p> : null}
      </Link>
    </motion.div>
  );
}

export function HubKpis({ kpis }: { kpis: CrmKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Kpi
        label="Precisa de ação hoje"
        value={String(kpis.signalsNeedingAction)}
        href="/crm#atencao"
        valueClassName={kpis.signalsNeedingAction > 0 ? "text-destructive" : "text-foreground"}
        index={0}
      />
      <Kpi
        label="Leads quentes"
        value={String(kpis.hotLeads)}
        href="/leads?scoreTier=Quente&status=aberto"
        index={1}
      />
      <Kpi
        label="Oportunidades abertas"
        value={String(kpis.openOpportunities)}
        href="/oportunidades?status=open"
        index={2}
      />
      <Kpi
        label="Valor em pipeline"
        value={formatCurrencyBRL(kpis.pipelineValue)}
        href="/oportunidades?status=open"
        index={3}
      />
      <Kpi
        label="Tarefas atrasadas"
        value={String(kpis.overdueTasks)}
        href="/tarefas?dueBucket=overdue"
        valueClassName={kpis.overdueTasks > 0 ? "text-warning" : "text-foreground"}
        index={4}
      />
    </div>
  );
}
