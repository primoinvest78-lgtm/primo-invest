"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { ReportCenterKpis } from "@/lib/data/reports";

function Kpi({
  label,
  value,
  sub,
  valueClassName,
  index,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  valueClassName?: string;
  index: number;
  href?: string;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={[
        "card-premium rounded-2xl p-4 transition-all duration-200",
        href ? "hover:border-primary/60 hover:shadow-card" : "",
      ].join(" ")}
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={String(value)} />
      </p>
      {sub ? <p className="mt-1 truncate text-caption text-card-beige-muted-foreground">{sub}</p> : null}
    </motion.div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function CenterKpis({ kpis }: { kpis: ReportCenterKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Relatórios gerados" value={kpis.total} index={0} href="/relatorios/historico" />
      <Kpi label="Últimos 30 dias" value={kpis.last30Days} index={1} href="/relatorios/historico" />
      <Kpi
        label="Agendados"
        value={kpis.scheduled}
        valueClassName={kpis.scheduled > 0 ? "text-accent" : "text-foreground"}
        index={2}
        href="/relatorios/historico?status=agendado"
      />
      <Kpi
        label="Compartilhados"
        value={kpis.shared}
        valueClassName={kpis.shared > 0 ? "text-primary" : "text-foreground"}
        index={3}
      />
      <Kpi
        label="Pendentes"
        value={kpis.pending}
        sub={kpis.pending > 0 ? "exigem emissão" : undefined}
        valueClassName={kpis.pending > 0 ? "text-warning" : "text-foreground"}
        index={4}
        href="#pendentes"
      />
      <Kpi label="Modelos" value={kpis.templates} index={5} href="#modelos" />
    </div>
  );
}
