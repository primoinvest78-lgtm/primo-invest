"use client";

import { AlertTriangle, Info, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import type { WealthAlert } from "@/lib/utils/wealth-helpers";

const ALERT_ICON = { danger: AlertTriangle, warning: TriangleAlert, info: Info };
const ALERT_STYLE = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-accent/30 bg-accent/10 text-accent",
};

function AlertWrapper({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block">
      {children}
    </Link>
  );
}

export function WealthAlertsSection({
  alerts,
  hrefFor,
}: {
  alerts: WealthAlert[];
  /** Onde cada alerta se resolve. Sem destino, o alerta fica só informativo. */
  hrefFor?: (alert: WealthAlert) => string | null;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-3 text-h2 font-bold text-foreground">Alertas patrimoniais</h3>
      <div className="space-y-2">
        {alerts.map((alert, index) => {
          const Icon = ALERT_ICON[alert.severity];
          return (
            <AlertWrapper key={alert.id} href={hrefFor?.(alert) ?? null}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
              className={[
                "flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5",
                ALERT_STYLE[alert.severity],
              ].join(" ")}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{alert.message}</span>
              {hrefFor?.(alert) ? <span className="shrink-0 text-xs font-bold underline-offset-2 hover:underline">Ver →</span> : null}
            </motion.div>
            </AlertWrapper>
          );
        })}
      </div>
    </div>
  );
}
