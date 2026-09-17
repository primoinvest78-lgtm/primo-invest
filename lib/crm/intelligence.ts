/**
 * Caminho para IA no Hub CRM — arquitetura, não implementação.
 *
 * Mesmo padrão já usado no Report Center (`lib/reports/intelligence.ts`):
 * este arquivo não chama nenhum modelo, só prepara a fronteira entre o
 * que já é dado real (`CrmSignalBundle`) e uma futura camada que narra
 * esse dado em linguagem natural — "por que esses 12 sinais críticos
 * importam" e "o que fazer primeiro".
 *
 * `buildCrmDigest` só resume o que `buildCrmSignals` já calculou —
 * nenhum critério novo, nenhuma suposição. Quando o modelo for plugado,
 * ele consome exatamente esse digest.
 */

import type { CrmSignal, CrmSignalBundle } from "@/lib/crm/signals";

export type CrmDigest = {
  generatedAt: string;
  totalSignals: number;
  countsByKind: CrmSignalBundle["countsByKind"];
  countsBySeverity: CrmSignalBundle["countsBySeverity"];
  /** Os sinais mais críticos, resumidos — o material que uma futura IA leria. */
  topSignals: { title: string; kind: CrmSignal["kind"]; reason: string }[];
};

export function buildCrmDigest(bundle: CrmSignalBundle): CrmDigest {
  return {
    generatedAt: new Date().toISOString(),
    totalSignals: bundle.signals.length,
    countsByKind: bundle.countsByKind,
    countsBySeverity: bundle.countsBySeverity,
    topSignals: bundle.signals.slice(0, 10).map((s) => ({ title: s.title, kind: s.kind, reason: s.reason })),
  };
}

export type CrmInsightHighlight = {
  category: "risco" | "oportunidade" | "produtividade";
  text: string;
  /** Títulos dos sinais que sustentam esta frase. */
  basedOn: string[];
};

export type CrmInsight = {
  generatedAt: string;
  source: "ai";
  model: string;
  highlights: CrmInsightHighlight[];
};

/**
 * Ainda não há modelo plugado. Lança de propósito — um "sem sinais
 * críticos hoje" (dado real) precisa ficar visualmente diferente de
 * "a narrativa por IA ainda não existe" (roadmap), então a UI nunca
 * pode tratar os dois casos como a mesma coisa.
 */
export function generateCrmInsight(_digest: CrmDigest): never {
  throw new Error(
    "Narrativa do Hub CRM por IA ainda não está implementada — buildCrmDigest() já prepara o material; falta plugar o modelo.",
  );
}
