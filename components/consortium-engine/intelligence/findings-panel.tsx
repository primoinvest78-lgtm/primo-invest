"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

import { ActionButton, EmptyState, Section, StatusBadge } from "@/components/consortium-engine/ui";
import { Input } from "@/components/ui/input";
import { reviewFinding } from "@/lib/actions/consortium-intelligence";
import { CATEGORY_LABEL, CONFIDENCE_LABEL, FINDING_STATUS_LABEL, SEVERITY_LABEL } from "@/lib/consortium-intelligence/findings";
import type { FindingRow } from "@/lib/data/consortium-intelligence";
import { formatDate } from "@/lib/utils/format";

const GOVERN = ["admin", "manager", "compliance"];
const SEVERITY_TONE: Record<string, string> = {
  CRITICAL: "border-destructive bg-destructive/10",
  HIGH: "border-destructive/40 bg-destructive/5",
  MEDIUM: "border-amber-500/50 bg-amber-500/5",
  LOW: "border-black/10",
};

function EvidenceBlock({ evidence }: { evidence: Record<string, unknown> }) {
  const rows: [string, unknown][] = [
    ["Fonte", evidence.source],
    ["Regra", evidence.rule],
    ["Versão", evidence.version],
    ["Cálculo", evidence.calculation],
  ].filter(([, v]) => v !== undefined && v !== null) as [string, unknown][];
  return (
    <div className="space-y-1 rounded-lg bg-black/5 p-2 text-xs">
      {rows.map(([k, v]) => (
        <p key={k}>
          <span className="font-semibold">{k}:</span> {String(v)}
        </p>
      ))}
      {evidence.data ? (
        <details>
          <summary className="cursor-pointer font-semibold text-accent">Dados</summary>
          <pre className="mt-1 max-h-40 overflow-auto text-[11px]">{JSON.stringify(evidence.data, null, 2)}</pre>
        </details>
      ) : null}
      {rows.length === 0 && !evidence.data ? <p className="text-card-beige-muted-foreground">Sem evidência adicional.</p> : null}
    </div>
  );
}

export function FindingsPanel({ findings, role }: { findings: FindingRow[]; role: string }) {
  const [filter, setFilter] = useState<"ativos" | "todos">("ativos");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const canGovern = GOVERN.includes(role);
  const shown = findings.filter((f) => filter === "todos" || f.status === "OPEN" || f.status === "ACKNOWLEDGED");

  return (
    <Section
      title="Achados de inteligência"
      subtitle="Anomalia, risco, padrão, inconsistência, oportunidade e alerta. Confiança não altera resultado oficial; críticos exigem revisão humana."
      actions={
        <div className="flex gap-1">
          {(["ativos", "todos"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${filter === k ? "border-primary bg-primary/15" : "border-black/15 hover:bg-black/5"}`}
            >
              {k === "ativos" ? "Ativos" : "Todos"}
            </button>
          ))}
        </div>
      }
    >
      {shown.length === 0 ? (
        <EmptyState>Nenhum achado {filter === "ativos" ? "ativo" : ""}. A varredura roda ao abrir esta página (a cada 30 min) ou sob demanda na aba Automação.</EmptyState>
      ) : (
        <div className="space-y-3">
          {shown.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className={`space-y-2 rounded-xl border p-3 text-sm ${SEVERITY_TONE[f.severity]}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {CATEGORY_LABEL[f.category]} · severidade {SEVERITY_LABEL[f.severity]} · confiança {CONFIDENCE_LABEL[f.confidence]} · regra de detecção: <span className="font-mono">{f.detector}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {f.requiresHumanReview ? <StatusBadge status="REVIEW" label="Revisão humana obrigatória" /> : null}
                  <StatusBadge status={f.status === "OPEN" ? "PENDING" : f.status === "RESOLVED" ? "COMPLETED" : f.status === "DISMISSED" ? "ARCHIVED" : "REVIEW"} label={FINDING_STATUS_LABEL[f.status]} />
                </div>
              </div>
              <p>{f.explanation}</p>
              <EvidenceBlock evidence={f.evidence} />
              <p className="text-xs text-card-beige-muted-foreground">
                Detectado em {formatDate(f.firstDetectedAt)} · última vez {formatDate(f.lastDetectedAt)} · {f.occurrences} ocorrência(s)
                {f.assemblyId ? (
                  <>
                    {" · "}
                    <Link href={`/consorcios/motor/assembleias/${f.assemblyId}`} className="font-semibold text-accent hover:underline">
                      abrir assembleia
                    </Link>
                  </>
                ) : null}
              </p>
              {f.reviewNotes ? (
                <p className="text-xs">
                  <span className="font-semibold">Revisão:</span> {f.reviewNotes} {f.reviewedByName ? `— ${f.reviewedByName}` : ""}
                </p>
              ) : null}
              {f.status === "OPEN" || f.status === "ACKNOWLEDGED" ? (
                <div className="flex flex-wrap items-start gap-2">
                  <Input
                    className="h-7 max-w-xs text-xs"
                    placeholder="Justificativa da revisão"
                    value={notes[f.id] ?? ""}
                    onChange={(e) => setNotes((s) => ({ ...s, [f.id]: e.target.value }))}
                  />
                  {f.status === "OPEN" ? <ActionButton size="xs" variant="outline" label="Em análise" action={() => reviewFinding(f.id, "ACKNOWLEDGED", notes[f.id] ?? "")} /> : null}
                  {!f.requiresHumanReview || canGovern ? (
                    <>
                      <ActionButton size="xs" label="Resolvido" action={() => reviewFinding(f.id, "RESOLVED", notes[f.id] ?? "")} />
                      <ActionButton size="xs" variant="ghost" label="Descartar" action={() => reviewFinding(f.id, "DISMISSED", notes[f.id] ?? "")} />
                    </>
                  ) : (
                    <p className="pt-1 text-xs text-amber-700">Encerramento exige papel de governança.</p>
                  )}
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
}
