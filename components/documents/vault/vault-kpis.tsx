"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { VaultDocument } from "@/lib/data/documents";
import { isExpired, isExpiringSoon, isRecent } from "@/lib/utils/document-helpers";

function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
  index,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
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
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.div>
  );
}

export function VaultKpis({
  documents,
  clientsWithoutDocsCount,
  sharedCount,
}: {
  documents: VaultDocument[];
  clientsWithoutDocsCount: number;
  sharedCount: number;
}) {
  const recent = documents.filter((d) => isRecent(d));
  const expired = documents.filter(isExpired);
  const expiringSoon = documents.filter((d) => isExpiringSoon(d));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total de documentos" value={String(documents.length)} animate={false} index={0} />
      <Kpi label="Recentes (7 dias)" value={String(recent.length)} animate={false} index={1} />
      <Kpi
        label="Vencidos"
        value={String(expired.length)}
        valueClassName={expired.length > 0 ? "text-destructive" : "text-foreground"}
        animate={false}
        index={2}
      />
      <Kpi label="Vencendo em breve" value={String(expiringSoon.length)} animate={false} index={3} />
      <Kpi
        label="Clientes sem documento"
        value={String(clientsWithoutDocsCount)}
        valueClassName={clientsWithoutDocsCount > 0 ? "text-warning" : "text-foreground"}
        animate={false}
        index={4}
      />
      <Kpi label="Compartilhados" value={String(sharedCount)} animate={false} index={5} />
    </div>
  );
}
