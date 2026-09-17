"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Gauge,
  LineChart,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { generatorHref } from "@/lib/reports/generator-state";
import {
  INTERNAL_ONLY_TYPES,
  REPORT_TYPE_DESCRIPTION,
  REPORT_TYPE_LABEL,
  REPORT_TYPES,
  type ReportType,
} from "@/lib/reports/types";

/**
 * Ponto de partida do Report Center.
 *
 * O ícone é escolhido AQUI, no componente de cliente — nunca vem junto
 * dos dados do servidor. Um componente do Lucide atravessando a
 * fronteira servidor→cliente como prop derruba a renderização inteira,
 * porque função não é serializável.
 */
const TYPE_ICON: Record<ReportType, LucideIcon> = {
  patrimonial: Gauge,
  investimentos: BriefcaseBusiness,
  cliente: UserRound,
  consorcios: Building2,
  operacional: Workflow,
  executivo: LineChart,
};

export function CenterTypeGrid({
  counts,
  canUseInternalTypes,
}: {
  /** Quantas emissões já existem de cada tipo — número real, do histórico. */
  counts: Record<string, number>;
  canUseInternalTypes: boolean;
}) {
  const types = REPORT_TYPES.filter((t) => canUseInternalTypes || !INTERNAL_ONLY_TYPES.includes(t));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Criar relatório
          </p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Tipos disponíveis</h3>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {types.map((type, index) => {
          const Icon = TYPE_ICON[type];
          const count = counts[type] ?? 0;

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: index * 0.05, ease: "easeOut" }}
              whileHover={{ y: -3 }}
              className="card-premium rounded-2xl transition-all duration-200"
            >
              <Link href={generatorHref({ tipo: type })} className="block p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-card-beige-muted-foreground" />
                </div>

                <p className="mt-3 text-h2 font-bold text-foreground">{REPORT_TYPE_LABEL[type]}</p>
                <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                  {REPORT_TYPE_DESCRIPTION[type]}
                </p>
                <p className="mt-3 text-caption text-card-beige-muted-foreground">
                  {count === 0
                    ? "Nenhuma emissão registrada"
                    : `${count} ${count === 1 ? "emissão registrada" : "emissões registradas"}`}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
