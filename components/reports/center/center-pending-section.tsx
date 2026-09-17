"use client";

import { AlertTriangle, CalendarClock, Loader2, Play, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cancelSchedule, runScheduledReport } from "@/lib/actions/reports";
import type { ReportListItem } from "@/lib/data/reports";
import { formatDateOnly } from "@/lib/reports/period";
import { REPORT_TYPE_LABEL, SCHEDULE_FREQUENCY_LABEL } from "@/lib/reports/types";

/**
 * Agendados e pendentes.
 *
 * Como não existe executor automático hoje, este bloco é o que faz o
 * agendamento valer alguma coisa: quando a data chega, o relatório sobe
 * pro topo marcado como vencido, e o botão "Emitir agora" gera com os
 * dados do momento e já reprograma a próxima data.
 */
export function CenterPendingSection({ scheduled }: { scheduled: ReportListItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, startRun] = useTransition();

  if (scheduled.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const ordered = [...scheduled].sort((a, b) => {
    const aDue = a.schedule?.nextRunOn ?? "9999-12-31";
    const bDue = b.schedule?.nextRunOn ?? "9999-12-31";
    return aDue < bDue ? -1 : 1;
  });

  function handleRun(id: string) {
    setError(null);
    setBusyId(id);
    startRun(async () => {
      try {
        await runScheduledReport(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível emitir.");
      } finally {
        setBusyId(null);
      }
    });
  }

  function handleCancel(id: string) {
    setError(null);
    setBusyId(id);
    startRun(async () => {
      try {
        await cancelSchedule(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível cancelar.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Recorrência
          </p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Agendados e pendentes</h3>
        </div>
        <span className="shrink-0 text-body-sm text-card-beige-muted-foreground">
          {ordered.length} {ordered.length === 1 ? "agendamento" : "agendamentos"}
        </span>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {ordered.map((report, index) => {
          const due = report.schedule?.nextRunOn ?? null;
          const overdue = due !== null && due <= today;
          const busy = busyId === report.id && running;

          return (
            <motion.li
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.03, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              className={[
                "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                overdue ? "border-warning/50 bg-warning/[0.07]" : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    overdue ? "bg-warning/15 text-warning" : "bg-accent/10 text-accent",
                  ].join(" ")}
                >
                  {overdue ? <AlertTriangle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/relatorios/${report.id}`}
                    className="block truncate text-body font-bold text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {report.title}
                  </Link>
                  <p className="truncate text-caption text-card-beige-muted-foreground">
                    {REPORT_TYPE_LABEL[report.type]}
                    {report.clientName ? ` · ${report.clientName}` : ""}
                    {report.schedule
                      ? ` · ${SCHEDULE_FREQUENCY_LABEL[report.schedule.frequency]}`
                      : ""}
                    {due ? ` · ${overdue ? "venceu" : "próxima"} em ${formatDateOnly(due)}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" onClick={() => handleRun(report.id)} disabled={busy}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Emitir agora
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancelar agendamento"
                  onClick={() => handleCancel(report.id)}
                  disabled={busy}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-3 text-caption text-card-beige-muted-foreground">
        A emissão não é automática: a plataforma registra a recorrência e avisa aqui quando a data
        chega. Emitir gera o documento com os dados daquele momento e reprograma a próxima data.
      </p>
    </section>
  );
}
