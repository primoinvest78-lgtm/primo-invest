/**
 * Tradutor de dados técnicos para a linguagem de quem usa o sistema.
 *
 * Regra do produto: nenhuma tela mostra código, identificador interno,
 * JSON ou nome de campo de banco. Tudo que vem "cru" (payload de
 * auditoria, detalhes de movimento, evidências) passa por aqui antes de
 * aparecer. Identificadores internos e selos de integridade são
 * omitidos — eles continuam gravados, só não são exibidos.
 */

const KEY_LABEL: Record<string, string> = {
  // gerais
  name: "Nome",
  full_name: "Nome completo",
  fullName: "Nome completo",
  title: "Título",
  description: "Descrição",
  notes: "Observações",
  note: "Observação",
  reason: "Motivo",
  status: "Situação",
  priority: "Prioridade",
  category: "Categoria",
  type: "Tipo",
  email: "E-mail",
  phone: "Telefone",
  amount: "Valor",
  value: "Valor",
  created_at: "Criado em",
  createdAt: "Criado em",
  updated_at: "Atualizado em",
  updatedAt: "Atualizado em",
  due_at: "Prazo",
  dueAt: "Prazo",
  due_date: "Vencimento",
  paid_at: "Pago em",
  paid_amount: "Valor pago",
  start_date: "Início",
  end_date: "Término",
  from: "De",
  to: "Para",
  before: "Antes",
  after: "Depois",
  // consórcios
  credit_amount: "Valor do crédito",
  creditAmount: "Valor do crédito",
  installment_amount: "Valor da parcela",
  installment_number: "Número da parcela",
  installmentNumber: "Número da parcela",
  total_installments: "Total de parcelas",
  paid_installments: "Parcelas pagas",
  administrator_name: "Administradora",
  contract_number: "Número do contrato",
  group_number: "Grupo",
  quota_number: "Cota",
  quotaNumber: "Cota",
  groupCode: "Grupo",
  group_code: "Grupo",
  quotaCount: "Quantidade de cotas",
  quota_count: "Quantidade de cotas",
  numberStart: "Número inicial",
  numberEnd: "Número final",
  assemblyNumber: "Assembleia",
  assembly_number: "Assembleia",
  assemblyDate: "Data da assembleia",
  assembly_date: "Data da assembleia",
  contestNumber: "Concurso",
  contest_number: "Concurso",
  prizes: "Prêmios",
  ruleKey: "Regra",
  rule_key: "Regra",
  version: "Versão",
  fromVersion: "Versão de origem",
  sequence: "Sequência",
  completeness: "Base de elegibilidade",
  imported: "Importadas",
  skippedLinkedToContract: "Ignoradas (vinculadas a contrato)",
  linked: "Vinculadas",
  skipped: "Ignoradas",
  created: "Criadas",
  contemplations: "Contemplações",
  run_number: "Cálculo nº",
  runNumber: "Cálculo nº",
  superseded: "Versões substituídas",
  errors: "Erros",
  warnings: "Avisos",
  bidIds: "Lances",
  scenario: "Cenário",
  method: "Método",
  via: "Forma",
  applies: "Aplica-se",
  // crédito e financeiro
  contractedCredit: "Crédito contratado",
  updatedCredit: "Crédito atualizado",
  bidAmount: "Lance",
  embeddedBidAmount: "Lance embutido",
  ownFundsBidAmount: "Lance com recursos próprios",
  netAvailableCredit: "Crédito líquido",
  usedBefore: "Utilizado antes",
  usedAfter: "Utilizado depois",
  updatedBefore: "Crédito antes",
  updatedAfter: "Crédito depois",
  remainingBefore: "Saldo antes",
  remainingAfter: "Saldo depois",
  balanceBefore: "Saldo devedor antes",
  balanceAfter: "Saldo devedor depois",
  openInstallmentsBefore: "Parcelas em aberto antes",
  openInstallmentsAfter: "Parcelas em aberto depois",
  applied: "Valor aplicado",
  unapplied: "Valor não aplicado",
  mode: "Modalidade",
  kind: "Tipo",
  change: "Troco",
  explanation: "Explicação",
  // inteligência / fonte
  stored: "Registrado no sistema",
  official: "Fonte oficial",
  attempted: "Tentativa de importação",
  normalization: "Ajuste de formato",
  notes_list: "Observações",
  known: "Cotas com dado",
  total: "Total",
  policy: "Política",
  occurrences: "Ocorrências",
  used: "Utilizado",
  available: "Disponível",
  entry: "Situação da cota",
  eligible: "Apta",
  paidUp: "Em dia",
  delinquent: "Inadimplente",
  alreadyContemplated: "Já contemplada",
  excluded: "Excluída",
  cancelled: "Cancelada",
  active: "Ativa",
  checked: "Verificados",
  ok: "Íntegro",
  divergent: "Divergentes",
  assemblyDate_: "Data da assembleia",
  semDado: "Sem dado",
  effectiveVersion: "Versão vigente",
  versions: "Versões",
  identical: "Idêntico",
  added: "Entrariam",
  removed: "Sairiam",
};

const VALUE_LABEL: Record<string, string> = {
  // genéricos
  active: "Ativo",
  inactive: "Inativo",
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  paid: "Pago",
  overdue: "Em atraso",
  negotiated: "Negociado",
  exempt: "Isento",
  amortized: "Amortizado",
  won: "Ganha",
  lost: "Perdida",
  open: "Aberta",
  low: "Baixa",
  normal: "Média",
  high: "Alta",
  urgent: "Urgente",
  archived: "Arquivado",
  proposal: "Proposta",
  settled: "Quitado",
  closed: "Encerrado",
  INSERT: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
  // consórcios
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  APPROVED: "Aprovado",
  PUBLISHED: "Publicado",
  SUPERSEDED: "Substituído",
  ARCHIVED: "Arquivado",
  PENDING: "Pendente",
  VERIFIED: "Verificado",
  INVALID: "Inválido",
  COMPLETE: "Completa",
  PARTIAL: "Parcial",
  DRAW: "Sorteio",
  BIDS: "Lances",
  DRAW_CANCELLED: "Sorteio (cota cancelada)",
  FREE_BID: "Lance livre",
  FIXED_BID: "Lance fixo",
  EMBEDDED_BID: "Lance embutido",
  DIRECT: "Número direto",
  EQUIVALENCE: "Número equivalente",
  APPROXIMATION: "Aproximação",
  FALLBACK: "Substituição",
  BID: "Lance",
  REDUCE_TERM: "Redução de prazo",
  REDUCE_INSTALLMENT: "Redução de parcela",
  SETTLEMENT_TOTAL: "Quitação total",
  SETTLEMENT_PARTIAL: "Quitação parcial",
  CREDIT_USAGE: "Utilização do crédito",
  CREDIT_UPDATE: "Atualização do crédito",
  CREDIT_USAGE_REVERSAL: "Estorno de utilização",
  AMORTIZATION: "Amortização",
  SCHEDULED: "Agendada",
  PREPARING: "Em preparação",
  ELIGIBILITY_LOCKED: "Elegibilidade travada",
  LOTTERY_LOCKED: "Resultado travado",
  DRAW_READY: "Pronta para apuração",
  DRAWING: "Apurando",
  DRAW_COMPLETED: "Sorteio apurado",
  BID_PROCESSING: "Lances apurados",
  HOMOLOGATION: "Em homologação",
  COMPLETED: "Concluído",
  LOCKED: "Travada",
  RETIFIED: "Retificada",
  ASSUME_ELIGIBLE: "Presumir apta",
  ASSUME_INELIGIBLE: "Presumir inapta",
  BLOCK: "Bloquear",
  DELINQUENT: "Inadimplente",
  UP_TO_DATE: "Em dia",
  UNKNOWN: "Sem dado",
  FEDERAL_LOTTERY: "Loteria Federal",
  OWN_DRAW: "Sorteio próprio",
  OTHER_REGULATED_SOURCE: "Outra fonte regulada",
  AUTOMATED_FETCH: "Coleta automática",
  MANUAL: "Manual",
  PENDING_DOCUMENTS: "Documentação pendente",
  UNDER_ANALYSIS: "Em análise",
  AVAILABLE: "Disponível",
  PARTIALLY_USED: "Parcialmente utilizado",
  USED: "Utilizado",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
  MANDATORY: "Obrigatório",
  CONDITIONAL: "Condicional",
  RECOMMENDED: "Recomendado",
  INFORMATIVE: "Informativo",
  RECEIVED: "Recebido",
  REJECTED: "Reprovado",
  WAIVED: "Dispensado",
  REQUESTED: "Solicitada",
  APPLIED: "Aplicada",
  inputHash: "entrada",
  ruleHash: "regra",
  eligibilityHash: "elegibilidade",
  calculationHash: "cálculo",
  resultHash: "resultado",
};

const HIDDEN_KEY = /(^id$|_id$|Id$|Ids$|_ids$|hash|Hash|fingerprint|organization|created_by|updated_by|uploaded_by|requested_by|approved_by|decided_by|storage_path|raw_payload|metadata|snapshot_ids|snapshotIds|trace|url$|entity_type|entityType)/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** "credit_amount" → "Credit amount" traduzido quando conhecido; senão palavras legíveis. */
export function humanizeKey(key: string): string {
  if (KEY_LABEL[key]) return KEY_LABEL[key];
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function isHiddenKey(key: string): boolean {
  return HIDDEN_KEY.test(key);
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function humanizeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  if (typeof value === "string") {
    if (UUID.test(value)) return "registro interno";
    if (/^[0-9a-f]{32,}$/i.test(value)) return "selo de integridade";
    if (ISO_DATE.test(value)) return formatDateBR(value);
    if (ISO_DATETIME.test(value)) {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? value : `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return VALUE_LABEL[value] ?? value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "nenhum";
    return value.map((v) => (v && typeof v === "object" ? describeObject(v as Record<string, unknown>) : humanizeValue(v))).join(" · ");
  }
  if (typeof value === "object") return describeObject(value as Record<string, unknown>);
  return String(value);
}

/** Objeto → "Campo: valor; Campo: valor" (sem campos internos). */
export function describeObject(obj: Record<string, unknown>): string {
  if ("prize" in obj && "positions" in obj) {
    return `${obj.prize}º prêmio, posições ${(obj.positions as number[]).join(", ")}`;
  }
  return humanizeEntries(obj)
    .map((e) => `${e.label}: ${e.value}`)
    .join("; ");
}

export type HumanEntry = { label: string; value: string };

/** Lista legível de um objeto qualquer, sem identificadores internos. */
export function humanizeEntries(obj: Record<string, unknown> | null | undefined): HumanEntry[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([k, v]) => !isHiddenKey(k) && v !== undefined)
    .map(([k, v]) => ({ label: humanizeKey(k), value: humanizeValue(v) }))
    .filter((e) => e.value !== "registro interno" && e.value !== "selo de integridade");
}

/** Campos que mudaram entre duas versões de um registro (auditoria). */
export function humanizeChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const out: { label: string; before: string; after: string }[] = [];
  for (const k of keys) {
    if (isHiddenKey(k) || k === "created_at" || k === "updated_at") continue;
    const b = before?.[k];
    const a = after?.[k];
    if (before && after && JSON.stringify(a) === JSON.stringify(b)) continue;
    out.push({ label: humanizeKey(k), before: before ? humanizeValue(b) : "—", after: after ? humanizeValue(a) : "—" });
  }
  return out.filter((c) => c.before !== "registro interno" || c.after !== "registro interno");
}

/** Remove trechos técnicos (selos em hexadecimal) de mensagens gravadas. */
export function stripTechnicalCodes(text: string): string {
  return text
    .replace(/\s*\((?:hash|selo)[^)]*\)/gi, "")
    .replace(/\b[0-9a-f]{10,}…?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
