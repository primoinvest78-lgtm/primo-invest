"use client";

import { motion } from "motion/react";

import { EmptyState } from "@/components/consortium-engine/ui";
import { HumanData } from "@/components/ui/human-data";
import { EVENT_TYPE_LABEL } from "@/lib/consortium-engine/labels.ts";
import type { EngineEvent } from "@/lib/data/consortium-engine";
import { humanizeKey } from "@/lib/utils/humanize";

function when(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

const CRITICAL = new Set(["REPRODUCTION_MISMATCH", "SOURCE_CONFLICT_DETECTED", "CALCULATION_FAILED", "RETIFICATION_REQUESTED"]);

export function AuditTimeline({ events }: { events: EngineEvent[] }) {
  if (events.length === 0) return <EmptyState>Nenhum evento registrado.</EmptyState>;
  return (
    <ol className="space-y-2">
      {events.map((e, i) => (
        <motion.li
          key={e.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
          className={`rounded-xl border px-3.5 py-2.5 transition-colors hover:bg-black/5 ${
            CRITICAL.has(e.eventType) ? "border-destructive/40 bg-destructive/5" : "border-black/10"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{EVENT_TYPE_LABEL[e.eventType] ?? humanizeKey(e.eventType.toLowerCase())}</p>
            <p className="text-xs text-card-beige-muted-foreground">
              {when(e.createdAt)} · {e.actorName ?? "sistema"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-primary">✓ Registro encadeado ao anterior — não pode ser alterado nem apagado</p>
          {Object.keys(e.payload).length > 0 ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs font-semibold text-accent">Detalhes</summary>
              <div className="mt-1 rounded-lg bg-black/5 p-2">
                <HumanData data={e.payload} />
              </div>
            </details>
          ) : null}
        </motion.li>
      ))}
    </ol>
  );
}
