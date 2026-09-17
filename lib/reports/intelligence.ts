/**
 * Caminho para o Resumo Executivo por IA — arquitetura, não implementação.
 *
 * Este arquivo NÃO chama nenhum modelo de linguagem e NÃO gera texto.
 * Existe pra deixar pronta a fronteira entre "dado real da plataforma"
 * e "uma futura camada de IA que narra esse dado" — quando essa camada
 * for ligada, ela consome exatamente `buildExecutiveSummaryInput()` e
 * devolve algo no formato `ExecutiveSummary`. Nada além disso muda.
 *
 * Por quê agora, sem implementar ainda:
 * - AGENTS.md / escopo do projeto (seção "Inteligência futura") já
 *   pede essa preparação e proíbe explicitamente IA fictícia ou
 *   recomendação sem base em dado.
 * - Pesquisa de mercado (set/2026) mostra o padrão consolidado em
 *   quem já fez isso — Schwab Portfolio Insights, Citi Sky, EY/Salesforce
 *   sobre wealth management, e as plataformas de consórcio brasileiras
 *   (Pampa Consórcios, Turn2C) — narrativa em cima de dado real do
 *   cliente, nunca geração especulativa; toda saída marcada como
 *   IA-gerada; humano confere antes de circular.
 *
 * O QUE ISSO SIGNIFICA NA PRÁTICA AQUI:
 * 1. `buildExecutiveSummaryInput` monta um resumo COMPACTO e 100%
 *    factual do `ReportPayload` (as mesmas seções que o usuário já vê
 *    no documento) — é o único material que um futuro prompt de LLM
 *    pode usar. Nunca inventar um campo que não esteja em `payload`.
 * 2. `ExecutiveSummary` é o formato de SAÍDA esperado — bate com as
 *    5 categorias já pedidas no escopo: principais mudanças, evolução
 *    patrimonial, pontos de atenção, principais oportunidades, e
 *    movimentações relevantes.
 * 3. Enquanto não há modelo plugado, a UI mostra um estado "em breve"
 *    (ver `components/reports/document/executive-summary-slot.tsx`) —
 *    nunca um resumo fabricado.
 */

import type { ReportPayload, ReportSection } from "@/lib/reports/types";

/** Uma linha factual extraída de uma seção do relatório — nunca calculada de novo. */
export type ExecutiveSummaryFact = {
  sectionId: string;
  sectionTitle: string;
  label: string;
  value: string;
};

export type ExecutiveSummaryInput = {
  reportType: ReportPayload["type"];
  title: string;
  clientName: string | null;
  periodLabel: string | null;
  generatedAt: string;
  /** Todo KPI de todas as seções incluídas — é o universo factual disponível. */
  facts: ExecutiveSummaryFact[];
  /** Presença de seções vazias ("Não disponível") — a IA precisa saber o que NÃO existe pra não inventar. */
  unavailableSections: string[];
};

/**
 * Extrai o material factual do payload já gerado — mesma regra do resto
 * do módulo: nada aqui é uma nova consulta, é leitura do que já foi
 * montado por `lib/reports/builders.ts`.
 */
export function buildExecutiveSummaryInput(payload: ReportPayload): ExecutiveSummaryInput {
  const facts: ExecutiveSummaryFact[] = [];
  const unavailableSections: string[] = [];

  for (const section of payload.sections) {
    collectFacts(section, facts);
    if (isEmptySection(section)) unavailableSections.push(section.title);
  }

  return {
    reportType: payload.type,
    title: payload.title,
    clientName: payload.clientName,
    periodLabel: payload.periodLabel,
    generatedAt: payload.generatedAt,
    facts,
    unavailableSections,
  };
}

function collectFacts(section: ReportSection, out: ExecutiveSummaryFact[]) {
  for (const kpi of section.kpis ?? []) {
    out.push({ sectionId: section.id, sectionTitle: section.title, label: kpi.label, value: kpi.value });
  }
}

function isEmptySection(section: ReportSection): boolean {
  return (
    (section.kpis?.length ?? 0) === 0 &&
    (section.charts?.length ?? 0) === 0 &&
    (section.tables?.length ?? 0) === 0
  );
}

/**
 * Formato de SAÍDA esperado de uma futura geração — 5 categorias, as
 * mesmas do escopo do projeto. Cada item aqui precisa apontar de volta
 * pra um `ExecutiveSummaryFact` (via `basedOn`) — um resumo sem
 * `basedOn` não tem como ter sido gerado a partir de dado real.
 */
export type ExecutiveSummaryHighlight = {
  category: "mudanca" | "evolucao" | "atencao" | "oportunidade" | "movimentacao";
  text: string;
  /** Rótulos dos ExecutiveSummaryFact que sustentam esta frase. */
  basedOn: string[];
};

export type ExecutiveSummary = {
  generatedAt: string;
  /** Identifica a origem pra nunca confundir com texto escrito por humano. */
  source: "ai";
  model: string;
  highlights: ExecutiveSummaryHighlight[];
};

/**
 * Ainda não há modelo plugado — chamar isso é o gatilho documentado
 * pra quando houver. Lança de propósito: um retorno silencioso
 * (`null`) convidaria a UI a tratar "não implementado" como "sem
 * dado", os dois exigem tratamento visual diferente.
 */
export function generateExecutiveSummary(_input: ExecutiveSummaryInput): never {
  throw new Error(
    "Resumo Executivo por IA ainda não está implementado — buildExecutiveSummaryInput() já prepara o material; falta plugar o modelo.",
  );
}
