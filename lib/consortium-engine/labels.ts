/**
 * Rótulos em português pra interface. Arquivo sem dependência de
 * `node:crypto` — seguro pra Client Components (NÃO importe index.ts
 * no cliente: ele reexporta hash.ts).
 */

export const RULE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  APPROVED: "Aprovada",
  PUBLISHED: "Publicada",
  SUPERSEDED: "Substituída",
  ARCHIVED: "Arquivada",
};

export const GROUP_STATUS_LABEL: Record<string, string> = {
  FORMING: "Em formação",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
  ARCHIVED: "Arquivado",
};

export const LOTTERY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando verificação",
  VERIFIED: "Verificado",
  INVALID: "Inválido",
};

export const SOURCE_LABEL: Record<string, string> = {
  FEDERAL_LOTTERY: "Loteria Federal",
  OTHER_REGULATED_SOURCE: "Outra fonte regulada",
};

export const QUOTA_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativa",
  CANCELLED: "Cancelada",
  EXCLUDED: "Excluída",
  AVAILABLE: "Não comercializada",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UP_TO_DATE: "Em dia",
  DELINQUENT: "Inadimplente",
  UNKNOWN: "Desconhecido",
};

export const ELIGIBILITY_SOURCE_LABEL: Record<string, string> = {
  CONTRACT: "Contrato",
  IMPORTED: "Importação",
  MANUAL: "Manual",
};

export const CONTEMPLATION_METHOD_LABEL: Record<string, string> = {
  DRAW: "Sorteio",
  DRAW_CANCELLED: "Sorteio (cota cancelada)",
  FREE_BID: "Lance livre",
  FIXED_BID: "Lance fixo",
  EMBEDDED_BID: "Lance embutido",
};

export const CONTEMPLATION_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  SELECTED: "Apurada",
  HOMOLOGATED: "Homologada",
  CANCELLED: "Cancelada",
  RETAINED: "Retida",
  RETIRED: "Baixada",
};

export const VIA_LABEL: Record<string, string> = {
  DIRECT: "número direto",
  EQUIVALENCE: "número equivalente",
  APPROXIMATION: "aproximação",
  FALLBACK: "substituição (fallback)",
  BID: "lance",
};

export const NUMBER_TYPE_LABEL: Record<string, string> = {
  CANDIDATE: "Candidato",
  EQUIVALENT_NUMBER: "Número equivalente",
  APPROXIMATION: "Aproximação",
  FALLBACK: "Substituição",
};

export const OUTCOME_LABEL: Record<string, string> = {
  ELIGIBLE: "Apta",
  INELIGIBLE: "Inapta",
  ELIMINATED: "Eliminado",
  SELECTED: "Contemplada",
};

export const REASON_LABEL: Record<string, string> = {
  NOT_EXISTS: "cota inexistente",
  NOT_ALLOCATED: "não comercializada",
  CANCELLED: "cancelada",
  NOT_CANCELLED: "não está cancelada",
  EXCLUDED: "excluída",
  DELINQUENT: "inadimplente",
  PAYMENT_UNKNOWN: "pagamento desconhecido",
  ALREADY_CONTEMPLATED: "já contemplada",
  UNKNOWN: "sem dado no snapshot",
  ALREADY_SELECTED: "já contemplada nesta apuração",
  OUT_OF_RANGE: "fora da faixa do grupo",
  PRESUMED: "aptidão presumida",
};

export const EQUIVALENCE_LABEL: Record<string, string> = {
  NONE: "Sem equivalência (fora da faixa é eliminado)",
  ZERO_AS_MAX: "Número zerado = última cota",
  MODULO: "Resto da divisão pelo tamanho do grupo",
  SUBTRACT_GROUP_SIZE: "Subtração sucessiva do tamanho do grupo",
  EXPLICIT_MAP: "Tabela de equivalência",
};

export const SEQUENCE_METHOD_LABEL: Record<string, string> = {
  NONE: "Não prevista",
  NEXT_HIGHER: "Imediatamente superior",
  NEXT_LOWER: "Imediatamente inferior",
  ALTERNATING_UP_FIRST: "Alternada (superior primeiro)",
  ALTERNATING_DOWN_FIRST: "Alternada (inferior primeiro)",
  PREDEFINED_SEQUENCE: "Sequência predefinida",
};

export const BID_TYPE_LABEL: Record<string, string> = {
  FREE_BID: "Lance livre",
  FIXED_BID: "Lance fixo",
  EMBEDDED_BID: "Lance embutido",
};

export const TIE_BREAK_LABEL: Record<string, string> = {
  DRAW_ORDER: "Ordem da apuração do sorteio",
  EARLIEST_SUBMISSION: "Oferta mais antiga",
  LOWEST_QUOTA: "Menor número de cota",
};

export const UNKNOWN_POLICY_LABEL: Record<string, string> = {
  BLOCK: "Bloquear apuração (exige base completa)",
  ASSUME_ELIGIBLE: "Presumir apta (conferência)",
  ASSUME_INELIGIBLE: "Presumir inapta (conferência)",
};

export const REQUIREMENT_STAGE_LABEL: Record<string, string> = {
  CONTEMPLATION: "Contemplação",
  ANALYSIS: "Análise",
  GUARANTEE: "Garantia",
  RELEASE: "Liberação",
};

export const REQUIREMENT_CLASS_LABEL: Record<string, string> = {
  MANDATORY: "Obrigatório",
  CONDITIONAL: "Condicional",
  RECOMMENDED: "Recomendado",
  INFORMATIVE: "Informativo",
};

export const REQUIREMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  RECEIVED: "Recebido",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
  WAIVED: "Dispensado",
};

export const GUARANTEE_TYPE_LABEL: Record<string, string> = {
  REAL_ESTATE_FIDUCIARY: "Alienação fiduciária de imóvel",
  VEHICLE_FIDUCIARY: "Alienação fiduciária de veículo",
  GUARANTOR: "Fiador",
  PLEDGE: "Caução",
  INSURANCE: "Seguro",
  OTHER: "Outra",
};

export const GUARANTEE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  UNDER_ANALYSIS: "Em análise",
  APPROVED: "Aprovada",
  REJECTED: "Reprovada",
  EXPIRED: "Vencida",
  RELEASED: "Liberada",
};

export const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  CREDIT_UPDATE: "Atualização do crédito",
  CREDIT_USAGE: "Utilização do crédito",
  CREDIT_USAGE_REVERSAL: "Estorno de utilização",
  AMORTIZATION: "Amortização",
  SETTLEMENT_PARTIAL: "Quitação parcial",
  SETTLEMENT_TOTAL: "Quitação total",
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  GROUP_CREATED: "Grupo criado",
  GROUP_UPDATED: "Grupo atualizado",
  QUOTAS_IMPORTED: "Situação de cotas importada",
  CONTRACT_QUOTAS_LINKED: "Cotas de clientes vinculadas",
  QUOTA_NUMBERING_GENERATED: "Numeração do grupo gerada",
  RULE_CREATED: "Regra criada",
  RULE_DRAFT_UPDATED: "Rascunho de regra alterado",
  RULE_VERSION_CREATED: "Nova versão de regra",
  RULE_REVIEW: "Regra enviada para revisão",
  RULE_DRAFT: "Regra devolvida para rascunho",
  RULE_APPROVED: "Regra aprovada",
  RULE_PUBLISHED: "Regra publicada",
  RULE_SUPERSEDED: "Regra substituída",
  RULE_ARCHIVED: "Regra arquivada",
  RULE_DRAFT_DELETED: "Rascunho de regra excluído",
  LOTTERY_IMPORTED: "Resultado oficial importado",
  LOTTERY_IMPORTED_INVALID: "Resultado importado com erro",
  LOTTERY_VERIFIED: "Resultado oficial verificado",
  LOTTERY_MARKED_INVALID: "Resultado marcado como inválido",
  SOURCE_CONFLICT_DETECTED: "Fonte divergente detectada",
  ASSEMBLY_CREATED: "Assembleia criada",
  STATUS_CHANGED: "Mudança de estado",
  SNAPSHOT_ELIGIBILITY: "Elegibilidade congelada",
  SNAPSHOT_LOTTERY: "Resultado oficial congelado",
  SNAPSHOT_RULE: "Regra congelada",
  SNAPSHOT_RESOURCES: "Recursos congelados",
  SNAPSHOT_BIDS: "Lances congelados",
  CALCULATION_DRAW: "Sorteio apurado",
  CALCULATION_BIDS: "Lances apurados",
  CALCULATION_FAILED: "Apuração interrompida",
  RETIFICATION_CALCULATION_DRAW: "Sorteio recalculado (retificação)",
  RETIFICATION_CALCULATION_BIDS: "Lances recalculados (retificação)",
  HOMOLOGATED: "Assembleia homologada",
  RETIFICATION_HOMOLOGATED: "Retificação homologada",
  REPRODUCTION_VERIFIED: "Reprodução confere",
  REPRODUCTION_MISMATCH: "Reprodução DIVERGENTE",
  RETIFICATION_REQUESTED: "Retificação solicitada",
  RETIFICATION_APPROVED: "Retificação aprovada",
  RETIFICATION_REJECTED: "Retificação rejeitada",
  BIDS_ATTACHED: "Lances vinculados",
  CREDIT_OPENED: "Direito ao crédito aberto",
  CREDIT_UNDER_ANALYSIS: "Crédito em análise",
  CREDIT_PENDING_DOCUMENTS: "Crédito aguardando documentos",
  CREDIT_APPROVED: "Crédito aprovado",
  CREDIT_AVAILABLE: "Crédito disponível",
  CREDIT_CLOSED: "Crédito encerrado",
  CREDIT_CANCELLED: "Crédito cancelado",
  CREDIT_USAGE: "Utilização de crédito",
  CREDIT_USAGE_REVERSAL: "Estorno de utilização",
  CREDIT_UPDATE: "Atualização de crédito",
  SIMULATION_RUN: "Simulação executada",
  ANOMALY_SCAN: "Varredura de anomalias",
  RULE_EXTRACTION_DRAFTED: "Regra extraída de documento (rascunho)",
  REQUIREMENT_PENDING: "Requisito marcado como pendente",
  REQUIREMENT_RECEIVED: "Documento recebido",
  REQUIREMENT_APPROVED: "Requisito aprovado",
  REQUIREMENT_REJECTED: "Requisito reprovado",
  REQUIREMENT_WAIVED: "Requisito dispensado",
  GUARANTEE_PENDING: "Garantia pendente",
  GUARANTEE_UNDER_ANALYSIS: "Garantia em análise",
  GUARANTEE_APPROVED: "Garantia aprovada",
  GUARANTEE_REJECTED: "Garantia reprovada",
  GUARANTEE_EXPIRED: "Garantia vencida",
  GUARANTEE_RELEASED: "Garantia liberada",
  CREDIT_PARTIALLY_USED: "Crédito parcialmente utilizado",
  CREDIT_USED: "Crédito utilizado",
  OWN_DRAW_COMMITTED: "Sorteio próprio: selo prévio registrado",
  OWN_DRAW_REVEALED: "Sorteio próprio realizado",
};

export function labelOf(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return map[key] ?? key;
}

export function formatQuota(n: number | null | undefined, digits: number): string {
  if (n === null || n === undefined) return "—";
  return String(n).padStart(digits, "0");
}
