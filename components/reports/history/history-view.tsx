"use client";

import { Copy, Eye, FileText, Search, Share2, X } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportListItem } from "@/lib/data/reports";
import { generatorHref } from "@/lib/reports/generator-state";
import { buildPeriodLabel } from "@/lib/reports/period";
import {
  REPORT_AUDIENCE_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TYPE_LABEL,
  REPORT_TYPES,
} from "@/lib/reports/types";
import { formatDateTime } from "@/lib/utils/format";

const ALL = "all";

const STATUS_CLASS: Record<string, string> = {
  gerado: "border-primary/40 bg-primary/10 text-primary",
  agendado: "border-warning/40 bg-warning/15 text-warning",
  falhou: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function HistoryView({ reports }: { reports: ReportListItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [author, setAuthor] = useState(ALL);

  const authors = useMemo(
    () =>
      Array.from(
        new Set(reports.map((r) => r.createdByName).filter((n): n is string => Boolean(n))),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [reports],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (type !== ALL && r.type !== type) return false;
      if (status !== ALL && r.status !== status) return false;
      if (author !== ALL && r.createdByName !== author) return false;
      if (!term) return true;
      return (
        r.title.toLowerCase().includes(term) ||
        (r.clientName ?? "").toLowerCase().includes(term) ||
        (r.createdByName ?? "").toLowerCase().includes(term)
      );
    });
  }, [reports, query, type, status, author]);

  const hasFilters = query.trim() !== "" || type !== ALL || status !== ALL || author !== ALL;

  function clear() {
    setQuery("");
    setType(ALL);
    setStatus(ALL);
    setAuthor(ALL);
  }

  return (
    <div className="space-y-5">
      <section className="card-premium rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-card-beige-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, cliente ou autor"
              className="pl-9"
            />
          </div>

          <Select value={type} onValueChange={(v) => setType(v ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os tipos</SelectItem>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {REPORT_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as situações</SelectItem>
              {Object.entries(REPORT_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={author} onValueChange={(v) => setAuthor(v ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Emitido por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os autores</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-body-sm text-card-beige-muted-foreground">
              {filtered.length} de {reports.length}{" "}
              {reports.length === 1 ? "relatório" : "relatórios"}
            </p>
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <section className="card-premium rounded-2xl p-10 text-center">
          <FileText className="mx-auto h-9 w-9 text-card-beige-muted-foreground" />
          <p className="mt-3 text-h2 font-bold text-foreground">
            {reports.length === 0 ? "Nenhum relatório emitido ainda" : "Nenhum resultado"}
          </p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            {reports.length === 0
              ? "Gere o primeiro relatório para começar o histórico."
              : "Ajuste os filtros para encontrar o que procura."}
          </p>
          {reports.length === 0 ? (
            <Button className="mt-4" render={<Link href="/relatorios/novo" />}>
              Novo relatório
            </Button>
          ) : null}
        </section>
      ) : (
        <section className="card-premium overflow-hidden rounded-2xl">
          {/* A tabela rola no próprio contêiner — a página nunca rola na
              horizontal, nem em tela de celular. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Relatório", "Tipo", "Cliente", "Período", "Emitido por", "Emitido em", "Situação", ""].map(
                    (column, index) => (
                      <th
                        key={column || index}
                        className={[
                          "px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground",
                          index === 0 ? "text-left" : "text-left",
                        ].join(" ")}
                      >
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.02, ease: "easeOut" }}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-primary/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/relatorios/${report.id}`}
                        className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {report.title}
                      </Link>
                      <span className="mt-0.5 block text-caption text-card-beige-muted-foreground">
                        {REPORT_AUDIENCE_LABEL[report.audience]} · {report.sections.length}{" "}
                        {report.sections.length === 1 ? "seção" : "seções"} · versão {report.version}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {REPORT_TYPE_LABEL[report.type]}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {report.clientId ? (
                        <Link
                          href={`/clientes/${report.clientId}`}
                          className="underline-offset-4 hover:text-primary hover:underline"
                        >
                          {report.clientName ?? "—"}
                        </Link>
                      ) : (
                        "Toda a carteira"
                      )}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {buildPeriodLabel(report.periodStart, report.periodEnd) ?? "Posição atual"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {report.createdByName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          STATUS_CLASS[report.status] ?? "border-border text-card-beige-muted-foreground",
                        ].join(" ")}
                      >
                        {REPORT_STATUS_LABEL[report.status] ?? report.status}
                      </span>
                      {report.shares.length > 0 ? (
                        <span className="mt-1 flex items-center gap-1 text-caption text-card-beige-muted-foreground">
                          <Share2 className="h-3 w-3" />
                          {report.shares.length}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Visualizar relatório"
                          render={<Link href={`/relatorios/${report.id}`} />}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Duplicar configuração"
                          render={
                            <Link
                              href={generatorHref({
                                tipo: report.type,
                                cliente: report.clientId,
                                inicio: report.periodStart,
                                fim: report.periodEnd,
                                publico: report.audience,
                              })}
                            />
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
