"use client";

import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrmSignal, CrmSignalKind } from "@/lib/crm/signals";

const KIND_ICON: Record<CrmSignalKind, typeof Users> = {
  lead: UserRound,
  opportunity: Briefcase,
  task: ClipboardList,
  client: Users,
};

const KIND_LABEL: Record<CrmSignalKind, string> = {
  lead: "Lead",
  opportunity: "Oportunidade",
  task: "Tarefa",
  client: "Cliente",
};

const SEVERITY_CLASS: Record<CrmSignal["severity"], string> = {
  critical: "border-destructive/50 bg-destructive/[0.07]",
  warning: "border-warning/50 bg-warning/[0.07]",
  info: "border-accent/40 bg-accent/[0.06]",
};

const SEVERITY_BADGE: Record<CrmSignal["severity"], "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

const FILTERS: { key: "all" | CrmSignalKind; label: string }[] = [
  { key: "all", label: "Tudo" },
  { key: "lead", label: "Leads" },
  { key: "opportunity", label: "Oportunidades" },
  { key: "task", label: "Tarefas" },
  { key: "client", label: "Clientes" },
];

/**
 * O feed unificado do hub: os quatro tipos de sinal (lead, oportunidade,
 * tarefa, cliente) já vêm priorizados e ordenados de `buildCrmSignals` —
 * este componente só filtra por tipo e renderiza, sem recalcular nada.
 */
export function AttentionFeed({ signals }: { signals: CrmSignal[] }) {
  const [filter, setFilter] = useState<"all" | CrmSignalKind>("all");

  const filtered = useMemo(
    () => (filter === "all" ? signals : signals.filter((s) => s.kind === filter)),
    [signals, filter],
  );

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Feed priorizado
            </p>
            <h3 className="mt-0.5 text-h2 font-bold text-foreground">Precisa de ação hoje</h3>
          </div>
        </div>
        <span className="shrink-0 text-body-sm text-card-beige-muted-foreground">
          {signals.length} {signals.length === 1 ? "sinal" : "sinais"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <p className="text-body-sm font-semibold text-foreground">Nenhum sinal pendente por aqui.</p>
          <p className="text-caption text-card-beige-muted-foreground">
            {filter === "all"
              ? "Nada exige ação imediata no book de hoje."
              : `Nenhum item de "${KIND_LABEL[filter as CrmSignalKind]}" precisa de ação agora.`}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((signal, index) => {
            const Icon = KIND_ICON[signal.kind];
            return (
              <motion.li
                key={signal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.02, ease: "easeOut" }}
                whileHover={{ y: -2 }}
              >
                <Link
                  href={signal.href}
                  className={[
                    "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:shadow-card",
                    SEVERITY_CLASS[signal.severity],
                  ].join(" ")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card-beige text-card-beige-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-bold text-foreground">
                        {signal.title}
                        <span className="ml-2 text-caption font-semibold uppercase text-card-beige-muted-foreground">
                          {KIND_LABEL[signal.kind]}
                        </span>
                      </p>
                      <p className="truncate text-caption text-card-beige-muted-foreground">
                        {signal.reason}
                        {signal.ownerName ? ` · ${signal.ownerName}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={SEVERITY_BADGE[signal.severity]} className="shrink-0">
                    {signal.severity === "critical" ? "Crítico" : signal.severity === "warning" ? "Atenção" : "Info"}
                  </Badge>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
