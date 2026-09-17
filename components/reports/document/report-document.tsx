"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { ExecutiveSummarySlot } from "@/components/reports/document/executive-summary-slot";
import { ReportChartView } from "@/components/reports/document/report-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatDateLong } from "@/lib/reports/period";
import { REPORT_TYPE_LABEL, type ReportPayload, type ReportSection } from "@/lib/reports/types";
import { formatDateTime } from "@/lib/utils/format";

/**
 * O DOCUMENTO.
 *
 * Este mesmo componente renderiza a prévia do gerador e o relatório
 * salvo — por isso a prévia é fiel por construção, não por coincidência:
 * não existe um "layout de prévia" que possa divergir do definitivo.
 *
 * Também é o que sai na impressão/PDF. As regras `print:` daqui e o
 * bloco `@media print` de globals.css trabalham juntos: na tela o
 * documento respira dentro do app; no papel vira folha A4 limpa, com
 * capa, identificação, rodapé e sem nenhum elemento de navegação.
 */

function SectionSource({ section }: { section: ReportSection }) {
  if (!section.source) return null;
  return (
    <Link
      href={section.source.href}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-caption font-semibold text-card-beige-muted-foreground transition-colors hover:border-primary hover:text-primary print:hidden"
    >
      {section.source.label}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

function SectionKpis({ section }: { section: ReportSection }) {
  if (!section.kpis || section.kpis.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3">
      {section.kpis.map((kpi, index) => (
        <motion.div
          key={`${section.id}-${kpi.label}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
          whileHover={{ y: -2 }}
          className="card-premium rounded-2xl p-4 transition-all duration-200 print:rounded-lg print:p-3"
        >
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{kpi.label}</p>
          <p className="mt-2 font-heading text-xl font-bold tracking-[-0.04em] text-foreground print:text-base">
            <AnimatedNumber value={kpi.value} />
          </p>
          {kpi.sub ? (
            <p className="mt-1 text-caption text-card-beige-muted-foreground">{kpi.sub}</p>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}

function SectionTables({ section }: { section: ReportSection }) {
  if (!section.tables || section.tables.length === 0) return null;

  return (
    <div className="space-y-5">
      {section.tables.map((tableData) => (
        <div key={tableData.id} className="min-w-0">
          <h4 className="mb-2 text-body-sm font-bold text-foreground">{tableData.title}</h4>

          {/* Tabela larga rola no seu próprio contêiner — o corpo da
              página nunca rola na horizontal, nem no celular. */}
          <div className="-mx-1 overflow-x-auto px-1 print:overflow-visible">
            <table className="w-full min-w-[520px] border-collapse text-body-sm print:min-w-0 print:text-[10px]">
              <thead>
                <tr className="border-b border-border">
                  {tableData.columns.map((column, index) => (
                    <th
                      key={column}
                      className={[
                        "py-2 pr-3 text-label font-bold uppercase text-card-beige-muted-foreground",
                        index === 0 ? "text-left" : "text-right",
                      ].join(" ")}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => {
                  const href = tableData.links?.[rowIndex] ?? null;
                  return (
                    <tr
                      key={`${tableData.id}-${rowIndex}`}
                      className="border-b border-border/60 last:border-b-0 print:break-inside-avoid"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={[
                            "py-2 pr-3 align-top",
                            cellIndex === 0
                              ? "text-left font-medium text-foreground"
                              : "text-right text-card-beige-muted-foreground",
                          ].join(" ")}
                        >
                          {/* Só a primeira coluna vira link: é o nome do
                              registro, e o alvo do clique fica óbvio. */}
                          {cellIndex === 0 && href ? (
                            <Link
                              href={href}
                              className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline print:no-underline"
                            >
                              {cell}
                              <ArrowUpRight className="h-3 w-3 shrink-0 opacity-50 print:hidden" />
                            </Link>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {tableData.note ? (
            <p className="mt-2 text-caption text-card-beige-muted-foreground">{tableData.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Section({ section, index }: { section: ReportSection; index: number }) {
  const hasContent =
    (section.kpis?.length ?? 0) > 0 ||
    (section.charts?.length ?? 0) > 0 ||
    (section.tables?.length ?? 0) > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 4) * 0.05, ease: "easeOut" }}
      className="card-premium space-y-5 rounded-2xl p-5 md:p-6 print:break-inside-avoid print:rounded-lg print:border print:p-4 print:shadow-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Seção {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">{section.title}</h3>
        </div>
        <SectionSource section={section} />
      </div>

      <SectionKpis section={section} />

      {section.charts?.map((chart) => (
        <div key={chart.id} className="min-w-0 space-y-2">
          <h4 className="text-body-sm font-bold text-foreground">{chart.title}</h4>
          <ReportChartView chart={chart} />
        </div>
      ))}

      <SectionTables section={section} />

      {section.note ? (
        <p
          className={[
            "text-body-sm",
            hasContent
              ? "text-card-beige-muted-foreground"
              : "rounded-xl border border-dashed border-border px-4 py-3 text-card-beige-muted-foreground",
          ].join(" ")}
        >
          {section.note}
        </p>
      ) : null}
    </motion.section>
  );
}

export function ReportDocument({
  payload,
  version,
  authorName,
}: {
  payload: ReportPayload;
  /** Versão da emissão — aparece no rodapé, junto da rastreabilidade. */
  version?: number;
  authorName?: string | null;
}) {
  const generatedAt = new Date(payload.generatedAt);
  const generatedLabel = formatDateTime(payload.generatedAt);

  return (
    <article className="space-y-5" data-report-document>
      {/* CAPA — identifica o documento sem depender do contexto do app.
          Impressa, é a primeira coisa que o leitor vê. */}
      <header className="block-navy-3d rounded-2xl p-6 md:p-8 print:rounded-lg print:border print:p-6 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-label font-bold uppercase text-primary">
              Primo Invest · Relatório {REPORT_TYPE_LABEL[payload.type]}
            </p>
            <h2 className="mt-3 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
              {payload.title}
            </h2>
            {payload.subtitle ? (
              <p className="mt-2 text-body text-secondary-foreground/75">{payload.subtitle}</p>
            ) : null}
          </div>

          <dl className="shrink-0 space-y-2 text-right">
            {payload.clientName ? (
              <div>
                <dt className="text-label font-bold uppercase text-secondary-foreground/60">Cliente</dt>
                <dd className="text-body font-bold text-secondary-foreground">{payload.clientName}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-label font-bold uppercase text-secondary-foreground/60">Período</dt>
              <dd className="text-body font-bold text-secondary-foreground">
                {payload.periodLabel ?? "Posição atual"}
              </dd>
            </div>
            <div>
              <dt className="text-label font-bold uppercase text-secondary-foreground/60">Emitido em</dt>
              <dd className="text-body font-bold text-secondary-foreground">
                {formatDateLong(generatedAt.toISOString().slice(0, 10))}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <ExecutiveSummarySlot payload={payload} />

      {payload.sections.map((section, index) => (
        <Section key={section.id} section={section} index={index} />
      ))}

      {/* RODAPÉ — rastreabilidade viaja junto do documento: quem emitiu,
          quando, qual versão e de onde vieram os números. Um PDF que
          circula fora do sistema continua auditável. */}
      <footer className="card-premium rounded-2xl p-5 print:rounded-lg print:border print:p-4 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption text-card-beige-muted-foreground">
            Emitido por <span className="font-bold text-foreground">{authorName ?? "Primo Invest"}</span>
            {" em "}
            {generatedLabel}
            {version ? ` · versão ${version}` : null}
          </p>
          <p className="text-caption text-card-beige-muted-foreground">
            Dados extraídos da plataforma Primo Invest na data de emissão.
          </p>
        </div>
        <p className="mt-2 text-caption text-card-beige-muted-foreground">
          Documento de uso restrito. Contém informações financeiras confidenciais e não deve ser
          divulgado sem autorização.
        </p>
      </footer>
    </article>
  );
}
