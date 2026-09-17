"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { AdminDashboardData } from "@/lib/admin/types";

function Kpi({
  label,
  value,
  valueClassName,
  index,
  onClick,
}: {
  label: string;
  value: string;
  valueClassName?: string;
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
        <AnimatedNumber value={value} />
      </p>
    </motion.button>
  );
}

export function AdminKpis({
  data,
  onGoToUsers,
  onGoToAlerts,
  onGoToActivity,
}: {
  data: AdminDashboardData;
  /** Clicar num KPI de usuários vai pra aba "Usuários". */
  onGoToUsers?: () => void;
  /** Clicar em "Alertas administrativos" rola até a seção de alertas, nesta mesma aba. */
  onGoToAlerts?: () => void;
  /** Clicar em "Eventos" vai pra aba "Auditoria". */
  onGoToActivity?: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Kpi label="Usuários ativos" value={String(data.counts.active)} index={0} onClick={onGoToUsers} />
      <Kpi
        label="Convites pendentes"
        value={String(data.counts.invited)}
        valueClassName={data.counts.invited > 0 ? "text-warning" : "text-foreground"}
        index={1}
        onClick={onGoToUsers}
      />
      <Kpi label="Usuários inativos" value={String(data.counts.inactive)} index={2} onClick={onGoToUsers} />
      <Kpi
        label="Alertas administrativos"
        value={String(data.alerts.length)}
        valueClassName={data.alerts.length > 0 ? "text-destructive" : "text-foreground"}
        index={3}
        onClick={onGoToAlerts}
      />
      <Kpi
        label="Eventos nos últimos 7 dias"
        value={String(data.activityLast7Days)}
        index={4}
        onClick={onGoToActivity}
      />
    </div>
  );
}
