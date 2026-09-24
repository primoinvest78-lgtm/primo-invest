import type { DrawRule } from "./types.ts";

/**
 * Rule Intelligence — compara duas versões de regra campo a campo e
 * explica o IMPACTO de cada mudança. Determinístico, sem IA: a
 * explicação vem de um mapa fixo campo → consequência.
 */

export type RuleFieldChange = {
  path: string;
  label: string;
  before: unknown;
  after: unknown;
  impact: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
};

const FIELD_INFO: { prefix: string; label: string; impact: string; severity: RuleFieldChange["severity"] }[] = [
  { prefix: "config.candidatePlan", label: "Plano de candidatos", impact: "Muda QUAIS números são extraídos do resultado oficial e em que ordem — altera diretamente quem é contemplado.", severity: "HIGH" },
  { prefix: "config.prizeDigits", label: "Dígitos por prêmio", impact: "Muda a validação do resultado oficial e as posições possíveis.", severity: "HIGH" },
  { prefix: "config.prizeCount", label: "Quantidade de prêmios", impact: "Muda a validação do resultado oficial.", severity: "HIGH" },
  { prefix: "config.equivalence", label: "Equivalência", impact: "Muda como números fora da faixa viram cotas — pode trocar a cota contemplada.", severity: "HIGH" },
  { prefix: "config.approximation", label: "Aproximação", impact: "Muda o que acontece quando o candidato é inapto, antes do próximo candidato.", severity: "HIGH" },
  { prefix: "config.fallback", label: "Substituição", impact: "Muda o critério quando todos os candidatos são eliminados.", severity: "HIGH" },
  { prefix: "config.eligibility", label: "Elegibilidade", impact: "Muda quais cotas concorrem (adimplência, contempladas, cotas sem dado).", severity: "HIGH" },
  { prefix: "config.cancelledQuotaDraws", label: "Sorteio de canceladas", impact: "Muda quantas contemplações vão para cotas canceladas.", severity: "MEDIUM" },
  { prefix: "config.resources", label: "Recursos", impact: "Muda quanto recurso é considerado disponível e, portanto, quantas contemplações cabem.", severity: "HIGH" },
  { prefix: "config.bids", label: "Lances", impact: "Muda modalidades, limites, ordem ou desempate de lances.", severity: "HIGH" },
  { prefix: "config.contingency", label: "Contingência", impact: "Muda qual extração é aceita quando não há sorteio na data.", severity: "MEDIUM" },
  { prefix: "effectiveFrom", label: "Início da vigência", impact: "Muda a partir de quando a regra vale.", severity: "MEDIUM" },
  { prefix: "effectiveUntil", label: "Fim da vigência", impact: "Muda até quando a regra vale.", severity: "MEDIUM" },
  { prefix: "groupId", label: "Grupo", impact: "Muda a quais grupos a regra se aplica.", severity: "MEDIUM" },
  { prefix: "source", label: "Fonte oficial", impact: "Muda qual fonte de sorteio é aceita.", severity: "HIGH" },
  { prefix: "regulationReference", label: "Referência do regulamento", impact: "Muda a fonte normativa citada — conferir se o regulamento mudou.", severity: "LOW" },
  { prefix: "name", label: "Nome", impact: "Só identificação.", severity: "LOW" },
  { prefix: "administratorName", label: "Administradora", impact: "Muda a quais grupos a regra se aplica.", severity: "MEDIUM" },
  { prefix: "productType", label: "Produto", impact: "Só classificação.", severity: "LOW" },
];

function flatten(value: unknown, path: string, out: Map<string, unknown>) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, path ? `${path}.${k}` : k, out);
  } else {
    out.set(path, value);
  }
}

function comparable(rule: DrawRule) {
  return {
    name: rule.name,
    administratorName: rule.administratorName,
    productType: rule.productType,
    groupId: rule.groupId,
    effectiveFrom: rule.effectiveFrom,
    effectiveUntil: rule.effectiveUntil,
    source: rule.source,
    regulationReference: rule.regulationReference,
    config: rule.config,
  };
}

export function diffRules(before: DrawRule, after: DrawRule): RuleFieldChange[] {
  const a = new Map<string, unknown>();
  const b = new Map<string, unknown>();
  flatten(comparable(before), "", a);
  flatten(comparable(after), "", b);
  const paths = [...new Set([...a.keys(), ...b.keys()])].sort();
  const changes: RuleFieldChange[] = [];
  for (const path of paths) {
    const x = a.get(path);
    const y = b.get(path);
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    const info = FIELD_INFO.find((f) => path === f.prefix || path.startsWith(`${f.prefix}.`)) ?? {
      label: path,
      impact: "Campo alterado.",
      severity: "LOW" as const,
    };
    changes.push({ path, label: info.label, before: x ?? null, after: y ?? null, impact: info.impact, severity: info.severity });
  }
  return changes;
}
