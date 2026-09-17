"use client";

import { ArrowUpRight, Eye, FileText, Flame, Share2 } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import type { ReportListItem } from "@/lib/data/reports";
import { buildPeriodLabel } from "@/lib/reports/period";
import { REPORT_TYPE_LABEL } from "@/lib/reports/types";
import { formatRelativeTime } from "@/lib/utils/format";

function ReportRow({ report, index }: { report: ReportListItem; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border transition-all duration-200 hover:border-primary/50"
    >
      <Link href={`/relatorios/${report.id}`} className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-bold text-foreground">{report.title}</span>
          <span className="block truncate text-caption text-card-beige-muted-foreground">
            {REPORT_TYPE_LABEL[report.type]}
            {report.clientName ? ` · ${report.clientName}` : " · toda a carteira"}
            {" · "}
            {buildPeriodLabel(report.periodStart, report.periodEnd) ?? "posição atual"}
          </span>
        </span>

        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-caption text-card-beige-muted-foreground">
            {formatRelativeTime(report.createdAt)}
          </span>
          <span className="mt-0.5 flex items-center justify-end gap-2 text-caption text-card-beige-muted-foreground">
            {report.viewCount > 0 ? (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {report.viewCount}
              </span>
            ) : null}
            {report.shares.length > 0 ? (
              <span className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                {report.shares.length}
              </span>
            ) : null}
          </span>
        </span>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-card-beige-muted-foreground" />
      </Link>
    </motion.li>
  );
}

/**
 * Recentes e mais consultados.
 *
 * "Mais consultados" ordena pelo contador real de aberturas — só aparece
 * quando algum relatório já foi aberto, para não exibir uma lista
 * "popular" que na verdade é a mesma lista de recentes em outra ordem.
 */
export function CenterRecentSection({ reports }: { reports: ReportListItem[] }) {
  const generated = reports.filter((r) => r.status === "gerado");
  const recent = generated.slice(0, 6);
  const mostViewed = [...generated]
    .filter((r) => r.viewCount > 0)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  if (generated.length === 0) {
    return (
      <section className="card-premium rounded-2xl p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-card-beige-muted-foreground" />
        <p className="mt-3 text-h2 font-bold text-foreground">Nenhum relatório emitido ainda</p>
        <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
          Escolha um tipo acima para gerar o primeiro documento da casa.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="card-premium rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Histórico
            </p>
            <h3 className="mt-1 text-h2 font-bold text-foreground">Relatórios recentes</h3>
          </div>
          <Link
            href="/relatorios/historico"
            className="shrink-0 text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        <ul className="mt-4 space-y-2">
          {recent.map((report, index) => (
            <ReportRow key={report.id} report={report} index={index} />
          ))}
        </ul>
      </section>

      {mostViewed.length > 0 ? (
        <section className="card-premium rounded-2xl p-5 md:p-6">
          <div className="min-w-0">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Uso</p>
            <h3 className="mt-1 flex items-center gap-2 text-h2 font-bold text-foreground">
              <Flame className="h-4 w-4 text-primary" />
              Mais consultados
            </h3>
          </div>

          <ul className="mt-4 space-y-2">
            {mostViewed.map((report, index) => (
              <motion.li
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.04, ease: "easeOut" }}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-border transition-all duration-200 hover:border-primary/50"
              >
                <Link
                  href={`/relatorios/${report.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-bold text-foreground">
                      {report.title}
                    </span>
                    <span className="block truncate text-caption text-card-beige-muted-foreground">
                      {REPORT_TYPE_LABEL[report.type]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-body-sm font-bold text-primary">
                    <Eye className="h-3.5 w-3.5" />
                    {report.viewCount}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
