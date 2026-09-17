"use client";

import { AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

import type { AdminAlert } from "@/lib/admin/types";

const SEVERITY_CLASS: Record<AdminAlert["severity"], string> = {
  danger: "border-destructive/50 bg-destructive/[0.07] text-destructive",
  warning: "border-warning/50 bg-warning/[0.07] text-warning",
  info: "border-accent/40 bg-accent/[0.06] text-accent",
};

/**
 * Alertas administrativos — some sozinho quando não há nenhum, porque
 * um painel de "tudo certo" fixo seria decorativo, não informativo.
 */
export function AdminAlerts({ alerts }: { alerts: AdminAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Requer atenção
          </p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Alertas administrativos</h3>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {alerts.map((alert, index) => (
          <motion.li
            key={alert.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.03, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className={["rounded-2xl border px-4 py-3 text-body-sm font-semibold transition-all duration-200", SEVERITY_CLASS[alert.severity]].join(" ")}
          >
            {alert.message}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
