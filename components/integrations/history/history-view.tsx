"use client";

import { AlertCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SyncRun } from "@/lib/data/integrations";
import {
  SYNC_RUN_STATUS_LABEL,
  SYNC_TRIGGER_LABEL,
  syncRunStatusLabel,
} from "@/lib/integrations/catalog";
import { formatDateTime } from "@/lib/utils/format";

const ALL = "all";

const STATUS_CLASS: Record<string, string> = {
  completed: "border-primary/40 bg-primary/10 text-primary",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  not_available: "border-border bg-muted text-muted-foreground",
  running: "border-accent/40 bg-accent/10 text-accent",
  started: "border-accent/40 bg-accent/10 text-accent",
  cancelled: "border-border bg-muted text-muted-foreground",
};

function durationLabel(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return "menos de 1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

export function HistoryView({ runs }: { runs: SyncRun[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(ALL);
  const [integration, setIntegration] = useState(ALL);
  const [expanded, setExpanded] = useState<string | null>(null);

  const integrations = useMemo(
    () => Array.from(new Set(runs.map((r) => r.integrationName))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [runs],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return runs.filter((r) => {
      if (status !== ALL && r.status !== status) return false;
      if (integration !== ALL && r.integrationName !== integration) return false;
      if (!term) return true;
      return r.integrationName.toLowerCase().includes(term) || (r.errorMessage ?? "").toLowerCase().includes(term);
    });
  }, [runs, query, status, integration]);

  const hasFilters = query.trim() !== "" || status !== ALL || integration !== ALL;

  return (
    <div className="space-y-5">
      <section className="card-premium rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-card-beige-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por integração ou erro"
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Situação">
                {() => (status === ALL ? "Todas as situações" : syncRunStatusLabel(status))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as situações</SelectItem>
              {Object.entries(SYNC_RUN_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={integration} onValueChange={(v) => setIntegration(v ?? ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Integração">
                {() => (integration === ALL ? "Todas as integrações" : integration)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as integrações</SelectItem>
              {integrations.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-body-sm text-card-beige-muted-foreground">
              {filtered.length} de {runs.length} {runs.length === 1 ? "execução" : "execuções"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatus(ALL);
                setIntegration(ALL);
              }}
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <section className="card-premium rounded-2xl p-10 text-center">
          <p className="text-h2 font-bold text-foreground">
            {runs.length === 0 ? "Nenhuma sincronização executada ainda" : "Nenhum resultado"}
          </p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            {runs.length === 0
              ? "Use “Testar conexão” ou “Sincronizar agora” numa integração pra ver o histórico aqui."
              : "Ajuste os filtros para encontrar o que procura."}
          </p>
        </section>
      ) : (
        <section className="card-premium overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Integração", "Início", "Duração", "Disparado por", "Processados", "Situação", ""].map((col, i) => (
                    <th
                      key={col || i}
                      className="px-4 py-3 text-left text-label font-bold uppercase text-card-beige-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((run, index) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.02, ease: "easeOut" }}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-primary/[0.04]"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link
                        href={`/integracoes/${run.integrationId}`}
                        className="underline-offset-4 hover:text-primary hover:underline"
                      >
                        {run.integrationName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDateTime(run.startedAt)}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {durationLabel(run.startedAt, run.finishedAt)}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {SYNC_TRIGGER_LABEL[run.triggeredBy] ?? run.triggeredBy}
                      {run.triggeredByUserName ? ` · ${run.triggeredByUserName}` : ""}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {run.recordsCreated + run.recordsUpdated}
                      {run.recordsFailed > 0 ? (
                        <span className="ml-1 text-destructive">({run.recordsFailed} com erro)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          STATUS_CLASS[run.status] ?? "border-border text-card-beige-muted-foreground",
                        ].join(" ")}
                      >
                        {syncRunStatusLabel(run.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {run.errorMessage ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Ver detalhe do erro"
                          onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {expanded ? (
            <div className="border-t border-border px-4 py-3">
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Detalhe</p>
              <p className="mt-1 text-body-sm text-foreground">
                {filtered.find((r) => r.id === expanded)?.errorMessage}
              </p>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
