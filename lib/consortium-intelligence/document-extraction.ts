import { blankRuleConfig, expandCandidatePlan } from "../consortium-engine/rule-config.ts";
import type { BidType, RuleConfig } from "../consortium-engine/types.ts";
import type { FindingConfidence } from "./findings.ts";

/**
 * Document Intelligence (fundação) — lê o texto de um regulamento e
 * PROPÕE uma configuração de regra. Extrator determinístico por
 * padrões de linguagem de regulamento (sem modelo). Toda extração:
 *   - vira regra em RASCUNHO (nunca publicada automaticamente);
 *   - traz, campo a campo, confiança e o trecho que a justifica;
 *   - passa por revisão → aprovação → publicação humanas.
 * Um modelo de linguagem futuro pode substituir `extractRuleFromText`
 * mantendo exatamente este contrato de saída.
 */

export type ExtractedField = {
  field: string;
  label: string;
  value: unknown;
  confidence: FindingConfidence;
  evidence: string | null;
};

export type RuleExtraction = {
  config: RuleConfig;
  fields: ExtractedField[];
  warnings: string[];
  expectedCandidates: number | null;
};

const ORDINAL = String.raw`(\d{1,2})\s*[º°ªo]?`;
const NUM_WORDS: Record<string, number> = { uma: 1, um: 1, duas: 2, dois: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, quinze: 15, vinte: 20 };

function snippet(text: string, index: number, len = 160): string {
  const start = Math.max(0, index - 40);
  return text.slice(start, Math.min(text.length, start + len)).replace(/\s+/g, " ").trim();
}

function norm(text: string): string {
  return text.replace(/ /g, " ").replace(/[ \t]+/g, " ");
}

/** Grupos de posições: "3º, 4º e 5º algarismos" → [3,4,5], na ordem do texto. */
function extractPositionGroups(text: string): { positions: number[]; index: number }[] {
  const re = new RegExp(`${ORDINAL}\\s*,\\s*${ORDINAL}(?:\\s*,\\s*${ORDINAL})?\\s*e\\s*${ORDINAL}\\s*(?:algarismos?|n[úu]meros?|d[íi]gitos?|posi[çc][õo]es)`, "gi");
  const out: { positions: number[]; index: number }[] = [];
  for (const m of text.matchAll(re)) {
    const positions = [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number);
    if (positions.every((p) => p >= 1 && p <= 8)) out.push({ positions, index: m.index ?? 0 });
  }
  return out;
}

export function extractRuleFromText(raw: string): RuleExtraction {
  const text = norm(raw);
  const lower = text.toLowerCase();
  const config = blankRuleConfig();
  const fields: ExtractedField[] = [];
  const warnings: string[] = [];
  const push = (field: string, label: string, value: unknown, confidence: FindingConfidence, idx: number | null) =>
    fields.push({ field, label, value, confidence, evidence: idx === null ? null : snippet(text, idx) });

  // Prêmios usados.
  let prizeCount = 5;
  const range = lower.match(/(\d)\s*[º°o]?\s*(?:ao|até o|a)\s*(\d)\s*[º°o]?\s*pr[êe]mio/);
  if (range) {
    prizeCount = Number(range[2]);
    push("prizeCount", "Prêmios considerados", `1º ao ${prizeCount}º`, "HIGH", range.index ?? 0);
  } else if (/cinco pr[êe]mios|5 pr[êe]mios/.test(lower)) {
    push("prizeCount", "Prêmios considerados", "5", "MEDIUM", lower.search(/cinco pr[êe]mios|5 pr[êe]mios/));
  } else {
    warnings.push("Quantidade de prêmios não encontrada — assumidos 5 (confirme no regulamento).");
    push("prizeCount", "Prêmios considerados", "5 (presumido)", "LOW", null);
  }
  config.prizeCount = prizeCount;

  // Dígitos por prêmio (Loteria Federal: 5).
  const digitsMatch = lower.match(/(\d)\s*(?:algarismos|d[íi]gitos)\s*(?:cada|por pr[êe]mio)/);
  config.prizeDigits = digitsMatch ? Number(digitsMatch[1]) : 5;
  push("prizeDigits", "Dígitos por prêmio", config.prizeDigits, digitsMatch ? "HIGH" : "LOW", digitsMatch?.index ?? null);

  // Padrões de posições + ordem.
  const groups = extractPositionGroups(text);
  const patterns: number[][] = [];
  for (const g of groups) if (!patterns.some((p) => p.join() === g.positions.join())) patterns.push(g.positions);
  if (patterns.length) {
    // Regulamentos descrevem prêmio a prêmio; "para cada padrão" inverte.
    const prizeMajor = !/para cada padr[ãa]o/i.test(text);
    const prizes = Array.from({ length: prizeCount }, (_, i) => i + 1);
    config.candidatePlan = expandCandidatePlan(prizes, patterns, prizeMajor ? "PRIZE_MAJOR" : "PATTERN_MAJOR");
    push("candidatePlan", "Posições de cada prêmio", patterns.map((p) => p.join(",")).join(" | "), "HIGH", groups[0].index);
    push("candidateOrder", "Ordem de apuração", "prêmio a prêmio, padrões na ordem do texto", "MEDIUM", groups[0].index);
  } else {
    warnings.push("Posições dos algarismos não encontradas — preencha o plano de candidatos manualmente.");
  }

  // Quantidade de centenas declarada (conferência).
  let expectedCandidates: number | null = null;
  const cent = lower.match(/(\d{1,2}|dez|quinze|vinte|cinco)\s*(?:\(\w+\)\s*)?centenas/);
  if (cent) {
    expectedCandidates = Number(cent[1]) || NUM_WORDS[cent[1]] || null;
    if (expectedCandidates && config.candidatePlan.length && expectedCandidates !== config.candidatePlan.length) {
      warnings.push(`O texto fala em ${expectedCandidates} centenas, o plano extraído gera ${config.candidatePlan.length}. Revise.`);
    }
    push("expectedCandidates", "Centenas declaradas no texto", expectedCandidates, "HIGH", cent.index ?? 0);
  }

  // Equivalência.
  const zeroMax = lower.search(/(representad[ao] pelo n[úu]mero 000|000[^.]{0,40}(corresponde|representa|equivale))/);
  const zeroElim = lower.search(/000[^.]{0,60}elimina|elimina[^.]{0,120}000/);
  const subtract = lower.search(/(subtrai|diminui|deduz)[^.]{0,60}(quantidade de participantes|n[úu]mero de cotas|total de cotas)/);
  if (zeroMax >= 0) {
    config.equivalence = { method: "ZERO_AS_MAX" };
    push("equivalence", "Equivalência", "000 representa a última cota", "MEDIUM", zeroMax);
  } else if (subtract >= 0) {
    config.equivalence = { method: "SUBTRACT_GROUP_SIZE" };
    push("equivalence", "Equivalência", "subtração do tamanho do grupo", "MEDIUM", subtract);
  } else {
    config.equivalence = { method: "NONE" };
    push("equivalence", "Equivalência", "sem equivalência (fora da faixa é eliminado)", zeroElim >= 0 ? "HIGH" : "LOW", zeroElim >= 0 ? zeroElim : null);
  }

  // Substituição quando tudo é eliminado.
  const alt = lower.search(/crescente e decrescente|alternad[ao]/);
  const higher = lower.search(/imediatamente superior/);
  const lowerIdx = lower.search(/imediatamente inferior/);
  if (alt >= 0) {
    config.fallback = { method: "ALTERNATING_UP_FIRST", wrapAround: false };
    push("fallback", "Substituição", "alternada (superior primeiro)", "MEDIUM", alt);
  } else if (higher >= 0) {
    config.fallback = { method: "NEXT_HIGHER", wrapAround: false };
    push("fallback", "Substituição", "imediatamente superior", "MEDIUM", higher);
  } else if (lowerIdx >= 0) {
    config.fallback = { method: "NEXT_LOWER", wrapAround: false };
    push("fallback", "Substituição", "imediatamente inferior", "MEDIUM", lowerIdx);
  } else {
    warnings.push("Critério de substituição não encontrado.");
  }
  if (/(retorna|volta)[^.]{0,40}(in[íi]cio|primeira cota|cota 001)/.test(lower)) {
    config.fallback.wrapAround = true;
    push("fallback.wrapAround", "Volta ao início da faixa", true, "MEDIUM", lower.search(/(retorna|volta)[^.]{0,40}(in[íi]cio|primeira cota|cota 001)/));
  }

  // Elegibilidade.
  const upToDate = lower.search(/(em dia|adimplente)/);
  config.eligibility.requireUpToDate = upToDate >= 0 || config.eligibility.requireUpToDate;
  push("eligibility.requireUpToDate", "Exige adimplência", true, upToDate >= 0 ? "HIGH" : "MEDIUM", upToDate >= 0 ? upToDate : null);
  const contemplated = lower.search(/j[áa] contemplad/);
  push("eligibility.excludeContemplated", "Exclui já contempladas", true, contemplated >= 0 ? "HIGH" : "MEDIUM", contemplated >= 0 ? contemplated : null);
  config.eligibility.unknownPolicy = "BLOCK";

  // Sorteio de canceladas.
  const cancelled = lower.search(/sorteio (de )?cota[s]? cancelad/);
  if (cancelled >= 0) {
    config.cancelledQuotaDraws = 1;
    push("cancelledQuotaDraws", "Sorteio de cotas canceladas", 1, "LOW", cancelled);
    warnings.push("Quantidade de sorteios de canceladas por assembleia presumida como 1 — confirme.");
  }

  // Lances.
  const hasBid = /lance/.test(lower);
  if (hasBid) {
    const order: BidType[] = [];
    const fixedIdx = lower.search(/lance fixo/);
    const freeIdx = lower.search(/lance livre/);
    const embIdx = lower.search(/lance embutido|embutido/);
    const seq = [
      { t: "FIXED_BID" as const, i: fixedIdx },
      { t: "FREE_BID" as const, i: freeIdx },
    ].filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
    for (const s of seq) order.push(s.t);
    if (embIdx >= 0) order.push("EMBEDDED_BID");
    config.bids.enabled = order.length > 0;
    config.bids.order = order;
    push("bids.order", "Modalidades de lance", order.join(" → "), "LOW", seq[0]?.i ?? embIdx);
    warnings.push("Ordem de processamento dos lances extraída pela ordem de menção no texto — confirme na tabela de sequência do regulamento.");
    const fixedPct = lower.match(/lance fixo[^.%]{0,80}?(\d{1,2}(?:[.,]\d+)?)\s*%|fixo em (\d{1,2}(?:[.,]\d+)?)\s*%/);
    if (fixedPct) {
      config.bids.fixedPercentage = Number((fixedPct[1] ?? fixedPct[2]).replace(",", "."));
      push("bids.fixedPercentage", "Percentual do lance fixo", `${config.bids.fixedPercentage}%`, "HIGH", fixedPct.index ?? 0);
    }
    const embPct = lower.match(/(?:embutido|parte do cr[ée]dito)[^.%]{0,80}?limitad[oa] a (\d{1,2}(?:[.,]\d+)?)\s*%|limitad[oa] a (\d{1,2}(?:[.,]\d+)?)\s*%[^.]{0,60}(?:embutido|cr[ée]dito)/);
    if (embPct) {
      config.bids.embeddedMaxPercentage = Number((embPct[1] ?? embPct[2]).replace(",", "."));
      push("bids.embeddedMaxPercentage", "Limite do lance embutido", `${config.bids.embeddedMaxPercentage}% do crédito`, "HIGH", embPct.index ?? 0);
    }
    if (/maior percentual/.test(lower)) push("bids.freeRanking", "Lance livre", "vence o maior percentual", "HIGH", lower.search(/maior percentual/));
    if (/superior ao fixo[^.]{0,80}livre|automaticamente ofertado como lance livre/.test(lower)) {
      config.bids.overFixedCompetesAsFree = true;
      push("bids.overFixedCompetesAsFree", "Fixo acima do % concorre como livre", true, "HIGH", lower.search(/automaticamente ofertado como lance livre|superior ao fixo/));
    }
    const tie = lower.search(/desempate[^.]{0,120}(apura[çc][ãa]o do sorteio|crit[ée]rios de apura[çc][ãa]o)/);
    if (tie >= 0) {
      config.bids.tieBreak = "DRAW_ORDER";
      push("bids.tieBreak", "Desempate", "ordem da apuração do sorteio", "HIGH", tie);
    }
  }

  // Contingência.
  const next = lower.search(/pr[óo]xima extra[çc][ãa]o/);
  if (next >= 0) {
    config.contingency.method = "NEXT_EXTRACTION";
    push("contingency", "Sem extração na data", "próxima extração", "HIGH", next);
  }

  return { config, fields, warnings, expectedCandidates };
}
