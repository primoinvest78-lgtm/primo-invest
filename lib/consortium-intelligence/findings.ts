/**
 * Consortium Intelligence Layer — tipos dos achados.
 *
 * A inteligência LÊ o Core e a auditoria; nunca escreve resultado
 * oficial. Todo achado carrega evidência estruturada (fonte, regra,
 * versão, cálculo, dado) e o detector que o gerou — nada de "segundo
 * minha análise" sem prova. Confiança não altera resultado oficial.
 */

export type FindingCategory = "ANOMALY" | "RISK" | "PATTERN" | "INCONSISTENCY" | "OPPORTUNITY" | "ALERT";
export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type FindingConfidence = "HIGH" | "MEDIUM" | "LOW";

export type FindingEvidence = {
  source?: string;
  rule?: string;
  version?: number | null;
  calculation?: string;
  data?: Record<string, unknown>;
};

export type Finding = {
  fingerprint: string;
  code: string;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  title: string;
  explanation: string;
  evidence: FindingEvidence;
  /** Nome estável da regra de detecção — sempre visível na interface. */
  detector: string;
  requiresHumanReview: boolean;
  groupId?: string | null;
  assemblyId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};

export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  ANOMALY: "Anomalia",
  RISK: "Risco",
  PATTERN: "Padrão",
  INCONSISTENCY: "Inconsistência",
  OPPORTUNITY: "Oportunidade",
  ALERT: "Alerta",
};

export const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const CONFIDENCE_LABEL: Record<FindingConfidence, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const FINDING_STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberto",
  ACKNOWLEDGED: "Em análise",
  RESOLVED: "Resolvido",
  DISMISSED: "Descartado",
};

/** Casos que SEMPRE exigem revisão humana (spec §13 / §40). */
export function mustReview(category: FindingCategory, severity: FindingSeverity, code: string): boolean {
  return (
    severity === "CRITICAL" ||
    code.startsWith("SOURCE_") ||
    code.startsWith("RULE_") ||
    code.startsWith("RETIFICATION_") ||
    code.startsWith("CALCULATION_") ||
    code.startsWith("FINANCIAL_") ||
    (category === "ANOMALY" && severity === "HIGH")
  );
}

export const SEVERITY_ORDER: Record<FindingSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** Nome legível de cada regra de detecção (o identificador nunca aparece na tela). */
export const DETECTOR_LABEL: Record<string, string> = {
  "reproducao-deterministica": "Reprodução do cálculo",
  "integridade-snapshot": "Integridade dos dados congelados",
  "integridade-regra": "Integridade da regra",
  "versao-vigente": "Versão vigente da regra",
  "integridade-fonte": "Integridade do resultado oficial",
  "fonte-verificada": "Verificação do resultado oficial",
  "universo-numerico": "Faixa de cotas do grupo",
  "snapshot-vs-resultado": "Elegibilidade × resultado",
  "base-parcial": "Base de elegibilidade parcial",
  "regra-snapshot": "Regra × elegibilidade",
  "duplicidade-contemplacao": "Contemplação em duplicidade",
  "recursos-vs-contemplacoes": "Recursos × contemplações",
  "resultado-conferencia": "Resultado de conferência",
  "resultado-pendente": "Resultado oficial pendente",
  "regra-pendente": "Regra pendente",
  "retificacao-pendente": "Retificação pendente",
  "unicidade-publicacao": "Publicação única de regra",
  "regra-proxima-assembleia": "Regra da próxima assembleia",
  "cadastro-cotas": "Cadastro de cotas",
  "lance-sem-apuracao": "Lance sem apuração",
  "cadeia-auditoria": "Cadeia de auditoria",
  "tentativas-fonte-divergente": "Tentativas com fonte divergente",
  "conferencia-fonte-oficial": "Conferência com a fonte oficial",
};

/** Nome legível dos selos de integridade (entrada, regra, ...). */
export const SEAL_LABEL: Record<string, string> = {
  inputHash: "dados de entrada",
  ruleHash: "regra",
  eligibilityHash: "elegibilidade",
  calculationHash: "cálculo",
  resultHash: "resultado",
};
