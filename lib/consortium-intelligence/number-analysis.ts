/**
 * Intelligent Number Analysis — analisa o COMPORTAMENTO DO ALGORITMO
 * sobre o histórico (distribuição, frequência, distância, concentração,
 * cobertura). Não prevê nada e não cria "números com mais chance": o
 * resultado da Loteria Federal é aleatório e padrões passados não o
 * alteram.
 */

export const NUMBER_ANALYSIS_DISCLAIMER =
  "Análise do sistema, não do sorteio: padrões históricos NÃO alteram a aleatoriedade da fonte oficial e não indicam números com maior chance.";

export type AttemptRow = {
  assemblyId: string;
  numberText: string;
  numberType: string;
  quotaNumber: number | null;
  outcome: string;
  reason: string | null;
  candidateOrder: number | null;
};

export type NumberAnalysis = {
  assemblies: number;
  attempts: number;
  selected: number;
  byBlock: { label: string; from: number; to: number; tested: number; selected: number }[];
  byType: Record<string, number>;
  reasons: Record<string, number>;
  /** Tentativas até chegar na contemplada (média). */
  avgAttemptsToSelect: number | null;
  /** Distância média entre o 1º candidato e a cota contemplada (substituição). */
  avgSubstitutionDistance: number | null;
  /** % das contemplações que precisaram de aproximação/substituição. */
  substitutionRate: number | null;
  eliminatedRate: number | null;
  /** % da faixa do grupo que já foi testada alguma vez. */
  coverage: number;
  mostTested: { quotaNumber: number; times: number }[];
  concentration: { topBlockShare: number; expectedShare: number } | null;
};

export function analyzeNumbers(rows: AttemptRow[], numbering: { numberStart: number; numberEnd: number; displayDigits: number }, blockSize = 100): NumberAnalysis {
  const size = numbering.numberEnd - numbering.numberStart + 1;
  const blocks: NumberAnalysis["byBlock"] = [];
  for (let from = numbering.numberStart; from <= numbering.numberEnd; from += blockSize) {
    const to = Math.min(from + blockSize - 1, numbering.numberEnd);
    blocks.push({
      label: `${String(from).padStart(numbering.displayDigits, "0")}–${String(to).padStart(numbering.displayDigits, "0")}`,
      from,
      to,
      tested: 0,
      selected: 0,
    });
  }
  const byType: Record<string, number> = {};
  const reasons: Record<string, number> = {};
  const tested = new Map<number, number>();
  const byAssembly = new Map<string, AttemptRow[]>();

  for (const r of rows) {
    byType[r.numberType] = (byType[r.numberType] ?? 0) + 1;
    if (r.reason) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
    byAssembly.set(r.assemblyId, [...(byAssembly.get(r.assemblyId) ?? []), r]);
    if (r.quotaNumber === null) continue;
    tested.set(r.quotaNumber, (tested.get(r.quotaNumber) ?? 0) + 1);
    const b = blocks.find((x) => r.quotaNumber! >= x.from && r.quotaNumber! <= x.to);
    if (b) {
      b.tested += 1;
      if (r.outcome === "SELECTED") b.selected += 1;
    }
  }

  const attemptsToSelect: number[] = [];
  const distances: number[] = [];
  let substituted = 0;
  let selectedTotal = 0;
  for (const list of byAssembly.values()) {
    let since = 0;
    const firstQuota = list.find((x) => x.quotaNumber !== null)?.quotaNumber ?? null;
    for (const r of list) {
      since += 1;
      if (r.outcome === "SELECTED") {
        selectedTotal += 1;
        attemptsToSelect.push(since);
        since = 0;
        if (r.numberType === "APPROXIMATION" || r.numberType === "FALLBACK") substituted += 1;
        if (firstQuota !== null && r.quotaNumber !== null) distances.push(Math.abs(r.quotaNumber - firstQuota));
      }
    }
  }

  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 100) / 100 : null);
  const topBlock = blocks.reduce((m, b) => (b.tested > m ? b.tested : m), 0);
  const totalTested = blocks.reduce((s, b) => s + b.tested, 0);

  return {
    assemblies: byAssembly.size,
    attempts: rows.length,
    selected: selectedTotal,
    byBlock: blocks,
    byType,
    reasons,
    avgAttemptsToSelect: avg(attemptsToSelect),
    avgSubstitutionDistance: avg(distances),
    substitutionRate: selectedTotal ? Math.round((substituted / selectedTotal) * 1000) / 10 : null,
    eliminatedRate: rows.length ? Math.round(((byType.CANDIDATE ? rows.filter((r) => r.outcome === "ELIMINATED").length : 0) / rows.length) * 1000) / 10 : null,
    coverage: Math.round((tested.size / size) * 1000) / 10,
    mostTested: [...tested.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 10).map(([quotaNumber, times]) => ({ quotaNumber, times })),
    concentration: totalTested ? { topBlockShare: Math.round((topBlock / totalTested) * 1000) / 10, expectedShare: Math.round((1 / blocks.length) * 1000) / 10 } : null,
  };
}
