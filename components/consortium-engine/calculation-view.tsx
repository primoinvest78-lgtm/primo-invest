"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { Hash } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import type { TraceStep } from "@/lib/consortium-engine/types.ts";
import type { DrawRunRecord } from "@/lib/data/consortium-engine";

/**
 * "Ver cálculo": a prova completa, passo a passo, na ordem em que o
 * motor executou. Nada aqui é recalculado — é o trace congelado.
 */

const STEP_TONE: Record<string, string> = {
  QUOTA_INELIGIBLE: "border-destructive/40 bg-destructive/5",
  EQUIVALENCE_ELIMINATED: "border-destructive/30 bg-destructive/5",
  CONTEMPLATED: "border-primary bg-primary/10",
  QUOTA_ELIGIBLE: "border-primary/50",
  FALLBACK_START: "border-amber-500/50 bg-amber-500/5",
  ELIGIBILITY_PRESUMED: "border-amber-500/50 bg-amber-500/5",
  RULE_HASH_MISMATCH: "border-destructive bg-destructive/10",
  VALIDATION_FAILED: "border-destructive bg-destructive/10",
  INVALID_SOURCE: "border-destructive bg-destructive/10",
  BIDS_HALTED: "border-amber-500/50 bg-amber-500/5",
  BID_REJECTED: "border-destructive/30",
};

const GROUPS: { title: string; codes: (c: string) => boolean }[] = [
  { title: "Entrada", codes: (c) => ["ASSEMBLY", "GROUP", "BIDS_START", "BIDS_RESOURCES"].includes(c) },
  { title: "Regra e versão", codes: (c) => c.startsWith("RULE") },
  { title: "Elegibilidade (snapshot)", codes: (c) => c.startsWith("ELIGIBILITY") },
  { title: "Resultado oficial", codes: (c) => c.startsWith("LOTTERY") || c === "VALIDATION_FAILED" || c === "INVALID_SOURCE" },
  { title: "Recursos", codes: (c) => c.startsWith("RESOURCES") },
  { title: "Números apurados", codes: (c) => c === "CANDIDATES" },
];

function TraceList({ steps }: { steps: TraceStep[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s) => (
        <motion.li
          key={s.step}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: Math.min(s.step * 0.01, 0.3) }}
          className={`flex gap-3 rounded-lg border px-3 py-2 text-sm ${STEP_TONE[s.code] ?? "border-black/10"}`}
        >
          <span className="w-6 shrink-0 text-right font-mono text-xs text-card-beige-muted-foreground">{s.step}</span>
          <span className="min-w-0 flex-1">
            <span className="text-foreground">{s.message}</span>
            <span className="ml-2 font-mono text-[10px] text-card-beige-muted-foreground">{s.code}</span>
          </span>
        </motion.li>
      ))}
    </ol>
  );
}

export function CalculationView({ run }: { run: DrawRunRecord }) {
  const [full, setFull] = useState(false);
  const header = run.trace.filter((s) => GROUPS.some((g) => g.codes(s.code)));
  const apuracao = run.trace.filter((s) => !GROUPS.some((g) => g.codes(s.code)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl bg-black/5 px-3 py-2">
        <Hash value={run.hashes.inputHash} label="entrada" />
        <Hash value={run.hashes.ruleHash} label="regra" />
        <Hash value={run.hashes.eligibilityHash} label="elegibilidade" />
        <Hash value={run.hashes.calculationHash} label="cálculo" />
        <Hash value={run.hashes.resultHash} label="resultado" />
        <span className="text-[11px] text-card-beige-muted-foreground">motor v{run.engineVersion}</span>
      </div>
      {full ? (
        <TraceList steps={run.trace} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {GROUPS.map((g) => {
              const steps = header.filter((s) => g.codes(s.code));
              if (!steps.length) return null;
              return (
                <div key={g.title}>
                  <p className="mb-1 text-label font-bold uppercase text-card-beige-muted-foreground">{g.title}</p>
                  <TraceList steps={steps} />
                </div>
              );
            })}
          </div>
          <div>
            <p className="mb-1 text-label font-bold uppercase text-card-beige-muted-foreground">
              Apuração: candidato → cota → elegibilidade → substituição → resultado
            </p>
            <TraceList steps={apuracao} />
          </div>
        </div>
      )}
      <Button size="xs" variant="outline" onClick={() => setFull((v) => !v)}>
        {full ? "Ver agrupado" : "Ver sequência completa"}
      </Button>
    </div>
  );
}
