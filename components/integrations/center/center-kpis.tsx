"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { IntegrationsKpis } from "@/lib/data/integrations";
import { formatDateTime } from "@/lib/utils/format";

function Kpi({
  label,
  value,
  sub,
  valueClassName,
  index,
}: {
  label: string;
  value: string;
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
      className="card-premium rounded-2xl p-4 transition-all duration-200"
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
      {sub ? <p className="mt-1 truncate text-caption text-card-beige-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

export function CenterKpis({ kpis }: { kpis: IntegrationsKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Integrações ativas" value={String(kpis.active)} index={0} />
      <Kpi
        label="Inativas"
        value={String(kpis.inactive)}
        valueClassName={kpis.inactive > 0 ? "text-warning" : "text-foreground"}
        index={1}
      />
      <Kpi label="Não configuradas" value={String(kpis.notConfigured)} index={2} />
      <Kpi label="Sincronizações executadas" value={String(kpis.totalSyncRuns)} index={3} />
      <Kpi
        label="Erros de sincronização"
        value={String(kpis.errorRuns)}
        valueClassName={kpis.errorRuns > 0 ? "text-destructive" : "text-foreground"}
        index={4}
      />
      <Kpi
        label="Precisam de atenção"
        value={String(kpis.needsAttention)}
        sub={kpis.lastSyncAt ? `Última sincronização: ${formatDateTime(kpis.lastSyncAt)}` : "Sem sincronizações ainda"}
        valueClassName={kpis.needsAttention > 0 ? "text-destructive" : "text-foreground"}
        index={5}
      />
    </div>
  );
}
