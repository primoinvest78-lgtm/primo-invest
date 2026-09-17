/**
 * Caminho para IA real da Central de Inteligência — arquitetura, não
 * implementação (mesmo padrão de `lib/reports/intelligence.ts` e
 * `lib/crm/intelligence.ts`).
 *
 * Hoje TODO insight desta central vem de regra determinística (ver
 * `lib/intelligence/rules.ts`) — nunca de um modelo. Por isso a UI
 * nunca escreve "IA detectou": o rótulo correto é "regra: <nome>",
 * sempre visível junto do insight. Quando uma IA real for plugada, ela
 * consome exatamente `buildIntelligenceDigest()` pra narrar, resumir
 * cliente, preparar reunião etc. — nunca decide nada financeiro sozinha
 * (toda ação neste módulo é confirmada por uma pessoa, ver
 * `lib/actions/intelligence.ts` e a tabela `intelligence_insight_events`).
 */

import type { Insight, InsightType } from "@/lib/intelligence/types";

export type IntelligenceDigest = {
  generatedAt: string;
  totalInsights: number;
  countsByType: Record<InsightType, number>;
  /** Os insights de maior prioridade, resumidos — material que uma futura IA leria. */
  topInsights: { title: string; type: InsightType; reason: string; clientName: string | null }[];
};

export function buildIntelligenceDigest(insights: Insight[]): IntelligenceDigest {
  const open = insights.filter((i) => i.status === "aberto");
  const countsByType: Record<InsightType, number> = { atencao: 0, oportunidade: 0, pendencia: 0, informacao: 0 };
  for (const insight of open) countsByType[insight.type] += 1;

  const priorityOrder = { alta: 0, media: 1, baixa: 2 } as const;
  const topInsights = [...open]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 12)
    .map((i) => ({ title: i.title, type: i.type, reason: i.reason, clientName: i.clientName }));

  return {
    generatedAt: new Date().toISOString(),
    totalInsights: open.length,
    countsByType,
    topInsights,
  };
}

export type IntelligenceNarrativeHighlight = {
  category: "risco" | "oportunidade" | "pendencia" | "resumo";
  text: string;
  basedOn: string[];
};

export type IntelligenceNarrative = {
  generatedAt: string;
  source: "ai";
  model: string;
  highlights: IntelligenceNarrativeHighlight[];
};

/**
 * Ainda não há modelo plugado. Lança de propósito — "nenhum insight
 * aberto" (dado real) precisa ficar visualmente diferente de "a
 * narrativa por IA ainda não existe" (roadmap).
 */
export function generateIntelligenceNarrative(_digest: IntelligenceDigest): never {
  throw new Error(
    "Narrativa da Central de Inteligência por IA ainda não está implementada — buildIntelligenceDigest() já prepara o material; falta plugar o modelo.",
  );
}

export type MeetingSummaryInput = {
  clientName: string;
  generatedAt: string;
  lastInteraction: string | null;
  openTasksCount: number;
  openOpportunitiesCount: number;
  pendingDocumentsCount: number;
  goalsAtRiskCount: number;
  recentTopics: string[];
};

/**
 * Resumo automático de reunião — mesma regra: sem modelo plugado, não
 * existe resumo em texto corrido, só a estrutura factual (ver
 * `lib/data/intelligence.ts` → `getMeetingPreparation`), que é
 * exatamente o material que este resumo consumiria.
 */
export function generateMeetingSummary(_input: MeetingSummaryInput): never {
  throw new Error(
    "Resumo automático de reunião por IA ainda não está implementado — a preparação factual já está pronta; falta plugar o modelo.",
  );
}
