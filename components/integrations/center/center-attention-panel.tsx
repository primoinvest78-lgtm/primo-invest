"use client";

import { AlertTriangle, Check, Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { resolveAlert } from "@/lib/actions/integrations";
import type { IntegrationAlert } from "@/lib/data/integrations";
import { ALERT_SEVERITY_LABEL, ALERT_TYPE_LABEL } from "@/lib/integrations/catalog";
import { formatRelativeTime } from "@/lib/utils/format";

const SEVERITY_CLASS: Record<string, string> = {
  critical: "border-destructive/50 bg-destructive/[0.07] text-destructive",
  warning: "border-warning/50 bg-warning/[0.07] text-warning",
  info: "border-accent/40 bg-accent/[0.06] text-accent",
};

/**
 * Alertas em aberto — a lista de "integrações que precisam de
 * atenção" do dashboard. Some sozinha quando não há nenhum alerta
 * aberto, porque um painel de "tudo certo" que nunca reflete nada
 * ficaria idêntico o tempo todo, ao contrário de um vazio de verdade.
 */
export function CenterAttentionPanel({ alerts }: { alerts: IntegrationAlert[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = alerts.filter((a) => a.status === "open");
  if (open.length === 0) return null;

  function handleResolve(alertId: string, integrationId: string) {
    setBusyId(alertId);
    startTransition(async () => {
      try {
        await resolveAlert(alertId, integrationId);
        router.refresh();
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Requer atenção
            </p>
            <h3 className="mt-0.5 text-h2 font-bold text-foreground">Alertas em aberto</h3>
          </div>
        </div>
        <span className="shrink-0 text-body-sm text-card-beige-muted-foreground">
          {open.length} {open.length === 1 ? "alerta" : "alertas"}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {open.map((alert, index) => {
          const busy = busyId === alert.id && pending;
          return (
            <motion.li
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.03, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              className={[
                "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                SEVERITY_CLASS[alert.severity] ?? "border-border",
              ].join(" ")}
            >
              <div className="min-w-0">
                <p className="truncate text-body-sm font-bold text-foreground">
                  {ALERT_TYPE_LABEL[alert.alertType as keyof typeof ALERT_TYPE_LABEL] ?? alert.alertType}
                  <span className="ml-2 text-caption font-semibold uppercase text-card-beige-muted-foreground">
                    {ALERT_SEVERITY_LABEL[alert.severity as keyof typeof ALERT_SEVERITY_LABEL] ?? alert.severity}
                  </span>
                </p>
                <p className="truncate text-caption text-card-beige-muted-foreground">
                  {alert.message} · {formatRelativeTime(alert.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ver integração"
                  nativeButton={false}
                  render={<Link href={`/integracoes/${alert.integrationId}`} />}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolve(alert.id, alert.integrationId)}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Resolver
                </Button>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
