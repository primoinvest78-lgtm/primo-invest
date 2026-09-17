/**
 * Tipos do Payment Intelligence Engine — sem dependência de servidor,
 * seguros pra Client Components.
 */

export const PAYMENT_STATUSES = [
  "recebido",
  "processando",
  "identificado",
  "conciliado",
  "aguardando_revisao",
  "excecao",
  "rejeitado",
  "duplicado",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  recebido: "Recebido",
  processando: "Processando",
  identificado: "Identificado",
  conciliado: "Conciliado",
  aguardando_revisao: "Aguardando revisão",
  excecao: "Exceção",
  rejeitado: "Rejeitado",
  duplicado: "Duplicado",
};

export const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  recebido: "border-accent/30 bg-accent/10 text-accent",
  processando: "border-accent/30 bg-accent/10 text-accent",
  identificado: "border-accent/30 bg-accent/10 text-accent",
  conciliado: "border-primary/30 bg-primary/10 text-primary",
  aguardando_revisao: "border-warning/40 bg-warning/15 text-warning",
  excecao: "border-destructive/40 bg-destructive/10 text-destructive",
  rejeitado: "border-border bg-muted text-muted-foreground",
  duplicado: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const PAYMENT_CONFIDENCE = ["alta", "media", "baixa"] as const;
export type PaymentConfidence = (typeof PAYMENT_CONFIDENCE)[number];

export const PAYMENT_CONFIDENCE_LABEL: Record<PaymentConfidence, string> = {
  alta: "Alta confiança",
  media: "Média confiança",
  baixa: "Baixa confiança",
};

export const PAYMENT_CONFIDENCE_CLASS: Record<PaymentConfidence, string> = {
  alta: "border-primary/30 bg-primary/10 text-primary",
  media: "border-warning/40 bg-warning/15 text-warning",
  baixa: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const PAYMENT_EXCEPTION_TYPES = [
  "pagamento_duplicado",
  "comprovante_duplicado",
  "parcela_ja_paga",
  "valor_divergente",
  "cliente_divergente",
  "contrato_divergente",
  "data_incompativel",
  "beneficiario_divergente",
  "transacao_nao_encontrada",
  "inconsistencia_possivel",
] as const;
export type PaymentExceptionType = (typeof PAYMENT_EXCEPTION_TYPES)[number];

export const PAYMENT_EXCEPTION_LABEL: Record<PaymentExceptionType, string> = {
  pagamento_duplicado: "Pagamento duplicado",
  comprovante_duplicado: "Comprovante duplicado",
  parcela_ja_paga: "Parcela já paga",
  valor_divergente: "Valor divergente",
  cliente_divergente: "Cliente divergente",
  contrato_divergente: "Contrato divergente",
  data_incompativel: "Data incompatível",
  beneficiario_divergente: "Beneficiário divergente",
  transacao_nao_encontrada: "Transação não encontrada",
  inconsistencia_possivel: "Possível inconsistência",
};

export const PAYMENT_METHODS = ["pix", "ted", "doc", "boleto", "dinheiro", "outro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  ted: "TED",
  doc: "DOC",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

export const PAYMENT_ORIGINS = ["upload", "whatsapp", "email", "portal", "api"] as const;
export type PaymentOrigin = (typeof PAYMENT_ORIGINS)[number];

export const PAYMENT_ORIGIN_LABEL: Record<PaymentOrigin, string> = {
  upload: "Upload manual",
  whatsapp: "WhatsApp",
  email: "E-mail",
  portal: "Portal do cliente",
  api: "API",
};

export type PaymentEvidence = {
  id: string;
  documentId: string | null;
  documentStoragePath: string | null;
  origin: PaymentOrigin;
  status: PaymentStatus;
  extractedAmount: number | null;
  extractedDate: string | null;
  extractedTime: string | null;
  extractedMethod: string | null;
  extractedBank: string | null;
  extractedBeneficiary: string | null;
  extractedTransactionId: string | null;
  clientHint: string | null;
  notes: string | null;
  rejectionReason: string | null;
  uploadedByName: string | null;
  documentName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMatchCandidate = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  consortiumContractId: string | null;
  contractLabel: string | null;
  consortiumInstallmentId: string | null;
  installmentLabel: string | null;
  score: number;
  confidence: PaymentConfidence;
  scoreBreakdown: Record<string, number>;
  reasons: string[];
  divergences: string[];
  isSelected: boolean;
};

export type PaymentTransactionRecord = {
  id: string;
  evidenceId: string;
  clientId: string;
  clientName: string | null;
  consortiumContractId: string | null;
  contractLabel: string | null;
  consortiumInstallmentId: string | null;
  amount: number;
  status: "conciliado" | "revertido";
  autoConfirmed: boolean;
  confirmedByName: string | null;
  confirmedAt: string;
};

export type PaymentExceptionRecord = {
  id: string;
  evidenceId: string;
  exceptionType: PaymentExceptionType;
  details: string | null;
  status: "aberta" | "resolvida";
  resolvedByName: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type PaymentEvidenceDetail = {
  evidence: PaymentEvidence;
  matches: PaymentMatchCandidate[];
  exceptions: PaymentExceptionRecord[];
  transaction: PaymentTransactionRecord | null;
};
