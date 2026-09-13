"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { LeadListItem } from "@/lib/data/leads";
import { computeLeadScore } from "@/lib/utils/lead-score";

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
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.div>
  );
}

export function LeadsKpis({ leads }: { leads: LeadListItem[] }) {
  const total = leads.length;
  const novos = leads.filter((l) => l.status === "Novo").length;
  const quentes = leads.filter(
    (l) =>
      l.status !== "Convertido" && l.status !== "Perdido" && computeLeadScore(l).tier === "Quente",
  ).length;
  const emNegociacao = leads.filter((l) => l.status === "Negociação").length;
  const convertidos = leads.filter((l) => l.status === "Convertido").length;
  const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi label="Total de leads" value={String(total)} index={0} />
      <Kpi label="Leads novos" value={String(novos)} index={1} />
      <Kpi label="Leads quentes" value={String(quentes)} valueClassName="text-primary" index={2} />
      <Kpi label="Em negociação" value={String(emNegociacao)} index={3} />
      <Kpi label="Convertidos" value={String(convertidos)} valueClassName="text-primary" index={4} />
      <Kpi
        label="Taxa de conversão"
        value={`${taxaConversao.toFixed(1).replace(".", ",")}%`}
        animate={false}
        index={5}
      />
    </div>
  );
}
