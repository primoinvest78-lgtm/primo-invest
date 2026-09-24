/**
 * Tipos do domínio do motor de consórcios.
 *
 * Este diretório é TypeScript PURO: sem banco, sem relógio, sem
 * Math.random, sem rede. Toda função recebe tudo que precisa por
 * parâmetro — é isso que garante MESMO INPUT + MESMA VERSÃO DA REGRA +
 * MESMO SNAPSHOT = MESMO RESULTADO (e permite rodar os testes com
 * `node --test` sem nenhuma dependência).
 *
 * Imports relativos usam extensão `.ts` de propósito (Node 24 executa
 * TypeScript nativamente e exige a extensão).
 */

export const ENGINE_VERSION = "1.0.0";

// ── Numeração ────────────────────────────────────────────────────

export type GroupNumbering = {
  numberStart: number;
  numberEnd: number;
  /** Largura mínima de exibição (zeros à esquerda). 1000 com 3 → "1000". */
  displayDigits: number;
};

// ── Regra ────────────────────────────────────────────────────────

export const RULE_STATUSES = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "SUPERSEDED", "ARCHIVED"] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

export type DrawSource = "FEDERAL_LOTTERY" | "OTHER_REGULATED_SOURCE";

/** Um passo do plano de candidatos: quais posições (1-indexadas, da esquerda) de qual prêmio. */
export type CandidateStep = { prize: number; positions: number[] };

export const EQUIVALENCE_METHODS = ["NONE", "ZERO_AS_MAX", "MODULO", "SUBTRACT_GROUP_SIZE", "EXPLICIT_MAP"] as const;
export type EquivalenceMethod = (typeof EQUIVALENCE_METHODS)[number];

export const APPROXIMATION_METHODS = [
  "NONE",
  "NEXT_HIGHER",
  "NEXT_LOWER",
  "ALTERNATING_UP_FIRST",
  "ALTERNATING_DOWN_FIRST",
] as const;
export type ApproximationMethod = (typeof APPROXIMATION_METHODS)[number];

export const FALLBACK_METHODS = [...APPROXIMATION_METHODS, "PREDEFINED_SEQUENCE"] as const;
export type FallbackMethod = (typeof FALLBACK_METHODS)[number];

export const BID_TYPES = ["FREE_BID", "FIXED_BID", "EMBEDDED_BID"] as const;
export type BidType = (typeof BID_TYPES)[number];

export const TIE_BREAK_METHODS = ["DRAW_ORDER", "EARLIEST_SUBMISSION", "LOWEST_QUOTA"] as const;
export type TieBreakMethod = (typeof TIE_BREAK_METHODS)[number];

export type UnknownEligibilityPolicy = "ASSUME_ELIGIBLE" | "ASSUME_INELIGIBLE" | "BLOCK";

export type RuleConfig = {
  calculationMethod: "LOTTERY_DIGIT_EXTRACTION";
  /** Dígitos esperados em cada prêmio da fonte (Federal: 5). */
  prizeDigits: number;
  /** Quantidade de prêmios esperada (Federal: 5). */
  prizeCount: number;
  /** Plano ordenado de candidatos — a ordem É a ordem de apuração. */
  candidatePlan: CandidateStep[];
  equivalence: {
    method: EquivalenceMethod;
    /** Só pra EXPLICIT_MAP: candidato bruto ("000") → número da cota. */
    map?: Record<string, number>;
  };
  /** Aproximação aplicada a CADA candidato inapto antes de passar ao próximo. */
  approximation: { method: ApproximationMethod; maxSteps: number; wrapAround: boolean };
  /** Aplicado só quando TODOS os candidatos foram esgotados. */
  fallback: { method: FallbackMethod; wrapAround: boolean; sequence?: number[] };
  eligibility: {
    requireUpToDate: boolean;
    excludeContemplated: boolean;
    /** Cotas das quais o PRIMO não tem dado (não é a administradora). */
    unknownPolicy: UnknownEligibilityPolicy;
  };
  resources: {
    /** Regulamento permite usar fundo de reserva pra contemplar. */
    reserveFundAllowed: boolean;
    /** Recursos próprios do lance entram no fundo que paga o crédito. */
    bidFundsCountTowardResources: boolean;
  };
  /** Sorteio de cotas canceladas (quando o regulamento prevê). */
  cancelledQuotaDraws: number;
  bids: {
    enabled: boolean;
    /** Ordem de processamento das modalidades (Res. BCB 285 art. 12: sempre depois do sorteio). */
    order: BidType[];
    fixedPercentage: number | null;
    minPercentage: number | null;
    maxPercentage: number | null;
    embeddedMaxPercentage: number | null;
    /** Lance fixo acima do percentual fixo concorre também como livre. */
    overFixedCompetesAsFree: boolean;
    tieBreak: TieBreakMethod;
    maxContemplations: number | null;
  };
  contingency: {
    method: "NEXT_EXTRACTION" | "MANUAL_REVIEW";
    /** Janela máxima entre a extração e a data da assembleia. */
    maxDaysBeforeAssembly: number;
  };
};

export type DrawRule = {
  id: string;
  ruleKey: string;
  version: number;
  name: string;
  administratorName: string;
  productType: string | null;
  groupId: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: RuleStatus;
  source: DrawSource;
  regulationReference: string | null;
  config: RuleConfig;
};

// ── Fonte oficial ────────────────────────────────────────────────

export type LotteryResult = {
  source: DrawSource;
  contestNumber: string;
  drawDate: string;
  /** Sempre texto — "03520" não pode virar 3520. */
  prizes: string[];
};

export type SourceValidationStatus = "VALID" | "INVALID_SOURCE" | "VALIDATION_FAILED";

// ── Elegibilidade ────────────────────────────────────────────────

export type QuotaRecord = {
  quotaNumber: number;
  status: "ACTIVE" | "CANCELLED" | "EXCLUDED" | "AVAILABLE";
  paymentStatus: "UP_TO_DATE" | "DELINQUENT" | "UNKNOWN";
  contemplated: boolean;
  contractId?: string | null;
};

export const INELIGIBILITY_REASONS = [
  "NOT_EXISTS",
  "NOT_ALLOCATED",
  "CANCELLED",
  "NOT_CANCELLED",
  "EXCLUDED",
  "DELINQUENT",
  "PAYMENT_UNKNOWN",
  "ALREADY_CONTEMPLATED",
  "UNKNOWN",
  "ALREADY_SELECTED",
] as const;
export type IneligibilityReason = (typeof INELIGIBILITY_REASONS)[number];

export type EligibilityEntry = {
  quotaNumber: number;
  active: boolean;
  paidUp: boolean | null;
  delinquent: boolean | null;
  alreadyContemplated: boolean;
  excluded: boolean;
  cancelled: boolean;
  eligible: boolean;
  reason: IneligibilityReason | null;
};

export type EligibilitySnapshot = {
  numbering: GroupNumbering;
  unknownPolicy: UnknownEligibilityPolicy;
  /** COMPLETE = todas as cotas da faixa têm dado; PARTIAL = há presunção. */
  completeness: "COMPLETE" | "PARTIAL";
  entries: EligibilityEntry[];
};

// ── Recursos ─────────────────────────────────────────────────────

export type ResourceStatus = "AVAILABLE" | "INSUFFICIENT" | "PARTIAL" | "BLOCKED";

export type ResourceInput = {
  commonFundBalance: number | null;
  reserveFundBalance: number | null;
  reserveFundUsable: boolean;
  creditAmount: number | null;
  plannedDrawContemplations: number;
  groupStatus: "FORMING" | "ACTIVE" | "CLOSED" | "SUSPENDED";
};

export type ResourceAssessment = {
  status: ResourceStatus;
  available: number;
  creditAmount: number;
  capacity: number;
  drawSlots: number;
  remainingAfterDraw: number;
  justification: string[];
};

// ── Lances ───────────────────────────────────────────────────────

export type BidInput = {
  id: string;
  quotaNumber: number;
  type: BidType;
  percentage: number | null;
  amount: number | null;
  embeddedAmount: number | null;
  submittedAt: string;
};

// ── Trace / resultado ────────────────────────────────────────────

export type TraceStep = {
  step: number;
  code: string;
  message: string;
  data?: Record<string, unknown>;
};

export type ContemplationMethod = "DRAW" | "DRAW_CANCELLED" | "FREE_BID" | "FIXED_BID" | "EMBEDDED_BID";

/** Registro de cada número testado (NUMBER, QUOTA, TYPE) — projeção do trace. */
export type DrawAttempt = {
  attempt: number;
  numberText: string;
  numberType: "CANDIDATE" | "EQUIVALENT_NUMBER" | "APPROXIMATION" | "FALLBACK";
  candidateOrder: number | null;
  /** Cota PRIMÁRIA testada — nunca o número equivalente. */
  quotaNumber: number | null;
  outcome: "ELIGIBLE" | "INELIGIBLE" | "ELIMINATED" | "SELECTED";
  reason: string | null;
};

export type Contemplation = {
  sequence: number;
  quotaNumber: number;
  quotaLabel: string;
  method: ContemplationMethod;
  candidateRaw: string | null;
  bidId: string | null;
  creditAmount: number;
  via: "DIRECT" | "EQUIVALENCE" | "APPROXIMATION" | "FALLBACK" | "BID";
};

export type RunStatus = "COMPLETED" | "INVALID_SOURCE" | "VALIDATION_FAILED" | "BLOCKED";

export type RunHashes = {
  inputHash: string;
  ruleHash: string;
  eligibilityHash: string;
  calculationHash: string;
  resultHash: string;
};

export type RunOutput = {
  engineVersion: string;
  phase: "DRAW" | "BIDS";
  status: RunStatus;
  errors: string[];
  contemplations: Contemplation[];
  /** Somente conferência quando a elegibilidade foi presumida. */
  official: boolean;
  resources: ResourceAssessment | null;
  remainingResources: number;
  trace: TraceStep[];
  /** Tentativas do sorteio (vazio na fase de lances). */
  attempts: DrawAttempt[];
  hashes: RunHashes;
};
