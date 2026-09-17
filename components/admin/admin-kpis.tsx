"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { AdminDashboardData } from "@/lib/admin/types";

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
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
    </motion.div>
  );
}

export function AdminKpis({ data }: { data: AdminDashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Kpi label="Usuários ativos" value={String(data.counts.active)} index={0} />
      <Kpi
        label="Convites pendentes"
        value={String(data.counts.invited)}
        valueClassName={data.counts.invited > 0 ? "text-warning" : "text-foreground"}
        index={1}
      />
      <Kpi label="Usuários inativos" value={String(data.counts.inactive)} index={2} />
      <Kpi
        label="Alertas administrativos"
        value={String(data.alerts.length)}
        valueClassName={data.alerts.length > 0 ? "text-destructive" : "text-foreground"}
        index={3}
      />
      <Kpi label="Eventos nos últimos 7 dias" value={String(data.activityLast7Days)} index={4} />
    </div>
  );
}
