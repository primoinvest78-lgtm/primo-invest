/**
 * Modelo, opções, validação e catálogo de documentos do cadastro de
 * novo cliente (assistente em etapas de /clientes).
 *
 * Compartilhado entre o formulário (cliente) e a ação de servidor —
 * a mesma regra valida dos dois lados. Não há react-hook-form/zod no
 * projeto; as validações aqui são funções puras, sem dependência nova.
 *
 * Escopo: responde "quem é o cliente?". Consórcio, análise de crédito,
 * contemplação e faturamento são fluxos separados e não entram aqui.
 */

// ---------------------------------------------------------------------------
// Opções
// ---------------------------------------------------------------------------

export type PersonType = "pf" | "pj";

export const RELATIONSHIP_TYPES = [
  { value: "prospect", label: "Prospect", tags: [] as string[] },
  { value: "cliente", label: "Cliente", tags: ["Cliente"] },
  { value: "consorciado", label: "Consorciado", tags: ["Consorciado"] },
  { value: "investidor", label: "Investidor", tags: ["Investidor"] },
  { value: "cliente_consorciado", label: "Cliente + Consorciado", tags: ["Cliente", "Consorciado"] },
  { value: "cliente_investidor", label: "Cliente + Investidor", tags: ["Cliente", "Investidor"] },
  {
    value: "cliente_investidor_consorciado",
    label: "Cliente + Investidor + Consorciado",
    tags: ["Cliente", "Investidor", "Consorciado"],
  },
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]["value"];

export const SEX_OPTIONS = ["Feminino", "Masculino", "Prefiro não informar"];

export const MARITAL_STATUS_OPTIONS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União estável" },
] as const;

export type MaritalStatus = (typeof MARITAL_STATUS_OPTIONS)[number]["value"] | "";

export const PROPERTY_REGIME_OPTIONS = [
  "Comunhão parcial de bens",
  "Comunhão universal de bens",
  "Separação total de bens",
  "Participação final nos aquestos",
  "Separação obrigatória de bens",
];

export const ID_DOCUMENT_TYPES = ["RG", "CNH", "Passaporte", "Outro documento oficial"];

export const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const RESIDENCE_TYPES = ["Própria", "Alugada", "Financiada", "Cedida", "Outra"];

export const EXTRA_CONTACT_TYPES = [
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export const PROFESSIONAL_STATUS_OPTIONS = [
  "CLT",
  "Funcionário público",
  "Empresário",
  "Autônomo",
  "Profissional liberal",
  "Aposentado",
  "Pensionista",
  "Produtor rural",
  "Investidor",
  "Outro",
];

export const INCOME_SOURCE_OPTIONS = [
  "Salário",
  "Pró-labore",
  "Lucros/dividendos",
  "Empresa",
  "Aluguéis",
  "Investimentos",
  "Aposentadoria",
  "Pensão",
  "Atividade autônoma",
  "Atividade rural",
  "Outras",
];

export const FUNDS_ORIGIN_OPTIONS = [
  "Salário",
  "Patrimônio próprio",
  "Venda de ativos",
  "Empresa",
  "Investimentos",
  "Herança",
  "Outros",
];

export const RISK_CLASSIFICATION_OPTIONS = ["Baixo", "Médio", "Alto"];

export const FAMILY_RELATIONSHIPS = [
  "Filho(a)",
  "Enteado(a)",
  "Pai",
  "Mãe",
  "Irmão(ã)",
  "Outro membro",
];

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

export const DOC_CATEGORIES = [
  { value: "identificacao", label: "Identificação" },
  { value: "cpf", label: "CPF" },
  { value: "residencia", label: "Residência" },
  { value: "renda", label: "Renda" },
  { value: "estado_civil", label: "Estado civil" },
  { value: "societario", label: "Societário" },
  { value: "outros", label: "Outros" },
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number]["value"];

/** Categoria do cadastro → categoria já usada pela Central de Documentos. */
export const DOC_CATEGORY_TO_CENTER: Record<DocCategory, string> = {
  identificacao: "pessoal",
  cpf: "pessoal",
  residencia: "pessoal",
  renda: "financeiro",
  estado_civil: "pessoal",
  societario: "juridico",
  outros: "outro",
};

/**
 * Nível de exigência — é uma regra interna de cadastro da casa, não uma
 * afirmação jurídica. Nada aqui diz que um documento é "legalmente
 * obrigatório" em qualquer situação.
 */
export type DocRequirement = "cadastro" | "condicional" | "operacao" | "analise";

export const DOC_REQUIREMENT_LABEL: Record<DocRequirement, string> = {
  cadastro: "Obrigatório para cadastro",
  condicional: "Condicional",
  operacao: "Solicitado para operação",
  analise: "Solicitado para análise",
};

export const DOC_STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "recebido", label: "Recebido" },
  { value: "em_validacao", label: "Em validação" },
  { value: "validado", label: "Validado" },
  { value: "rejeitado", label: "Rejeitado" },
  { value: "expirado", label: "Expirado" },
  { value: "dispensado", label: "Dispensado" },
] as const;

export type DocStatus = (typeof DOC_STATUSES)[number]["value"];

/**
 * Status do cadastro → status já aceito por document_requests
 * (solicitado/recebido/em_analise/aprovado/reprovado/arquivado).
 * "Expirado" e "Dispensado" não têm coluna própria: viram reprovado /
 * arquivado com o motivo registrado em decision_notes.
 */
export const DOC_STATUS_TO_REQUEST: Record<DocStatus, { status: string; decisionNote: string | null }> = {
  pendente: { status: "solicitado", decisionNote: null },
  recebido: { status: "recebido", decisionNote: null },
  em_validacao: { status: "em_analise", decisionNote: null },
  validado: { status: "aprovado", decisionNote: null },
  rejeitado: { status: "reprovado", decisionNote: null },
  expirado: { status: "reprovado", decisionNote: "Documento expirado (registrado no cadastro)." },
  dispensado: { status: "arquivado", decisionNote: "Documento dispensado no cadastro inicial." },
};

export const DOC_RESPONSIBLE_OPTIONS = [
  { value: "cliente", label: "Cliente" },
  { value: "assessor", label: "Assessor" },
  { value: "backoffice", label: "Retaguarda" },
  { value: "compliance", label: "Conformidade" },
  { value: "administracao", label: "Administração" },
] as const;

export type DocTemplate = {
  key: string;
  name: string;
  category: DocCategory;
  type: string;
  requirement: DocRequirement;
  /** Se entra marcado por padrão na lista de documentos a solicitar. */
  hint?: string;
};

export type DocItem = {
  key: string;
  name: string;
  category: DocCategory;
  type: string;
  requirement: DocRequirement;
  hint?: string;
  included: boolean;
  status: DocStatus;
  expiresAt: string;
  submittedBy: string;
  validatedBy: string;
  notes: string;
  file: File | null;
};

const PF_DOCS: DocTemplate[] = [
  {
    key: "pf_identidade",
    name: "Documento de identificação (RG, CNH ou equivalente)",
    category: "identificacao",
    type: "Documento oficial com foto",
    requirement: "cadastro",
  },
  { key: "pf_cpf", name: "CPF", category: "cpf", type: "Cadastro de pessoa física", requirement: "cadastro", hint: "Dispensável quando o CPF consta no documento de identificação." },
  { key: "pf_residencia", name: "Comprovante de residência", category: "residencia", type: "Conta de consumo ou equivalente", requirement: "cadastro", hint: "Preferencialmente emitido nos últimos 90 dias." },
  { key: "pf_nascimento", name: "Certidão de nascimento", category: "estado_civil", type: "Certidão", requirement: "condicional", hint: "Para clientes solteiros, quando solicitado." },
  { key: "pf_casamento", name: "Certidão de casamento", category: "estado_civil", type: "Certidão", requirement: "condicional", hint: "Quando o estado civil for casado(a)." },
  { key: "pf_uniao", name: "Declaração de união estável", category: "estado_civil", type: "Declaração", requirement: "condicional", hint: "Quando houver união estável." },
  { key: "pf_conjuge_doc", name: "Documento do cônjuge/companheiro(a)", category: "estado_civil", type: "Documento oficial com foto", requirement: "condicional", hint: "Quando houver cônjuge ou companheiro(a)." },
  { key: "pf_renda", name: "Comprovante de renda", category: "renda", type: "Comprovante", requirement: "condicional", hint: "Conforme o perfil e a operação pretendida." },
  { key: "pf_ir", name: "Declaração de Imposto de Renda", category: "renda", type: "Declaração fiscal", requirement: "operacao" },
  { key: "pf_extratos", name: "Extratos bancários", category: "renda", type: "Extrato", requirement: "analise" },
  { key: "pf_decore", name: "DECORE", category: "renda", type: "Declaração de rendimentos", requirement: "analise", hint: "Comum para profissionais liberais e autônomos." },
  { key: "pf_contracheques", name: "Contracheques", category: "renda", type: "Holerite", requirement: "analise", hint: "Comum para assalariados." },
  { key: "pf_declaracoes_prof", name: "Declarações profissionais", category: "outros", type: "Declaração", requirement: "operacao" },
];

const PJ_DOCS: DocTemplate[] = [
  { key: "pj_cartao_cnpj", name: "Cartão CNPJ", category: "societario", type: "Comprovante de inscrição", requirement: "cadastro" },
  { key: "pj_contrato_social", name: "Contrato social", category: "societario", type: "Ato constitutivo", requirement: "cadastro", hint: "Ou estatuto, conforme a natureza jurídica." },
  { key: "pj_endereco", name: "Comprovante de endereço da empresa", category: "residencia", type: "Conta de consumo ou equivalente", requirement: "cadastro" },
  { key: "pj_rep_doc", name: "Documento do representante legal", category: "identificacao", type: "Documento oficial com foto", requirement: "cadastro" },
  { key: "pj_alteracoes", name: "Alterações contratuais", category: "societario", type: "Alteração contratual", requirement: "condicional", hint: "Quando houver alterações registradas." },
  { key: "pj_estatuto", name: "Estatuto", category: "societario", type: "Ato constitutivo", requirement: "condicional", hint: "Quando aplicável à natureza jurídica." },
  { key: "pj_ata", name: "Ata / documentos societários", category: "societario", type: "Ata", requirement: "condicional", hint: "Quando aplicável (eleição de diretoria, por exemplo)." },
  { key: "pj_socios_docs", name: "Documentos dos sócios", category: "identificacao", type: "Documento oficial com foto", requirement: "condicional", hint: "Quando aplicável." },
  { key: "pj_procuracao", name: "Procuração", category: "outros", type: "Instrumento de mandato", requirement: "condicional", hint: "Quando houver procurador." },
  { key: "pj_faturamento", name: "Relação de faturamento", category: "renda", type: "Declaração", requirement: "analise" },
  { key: "pj_balanco", name: "Balanço patrimonial / DRE", category: "renda", type: "Demonstrativo contábil", requirement: "operacao" },
];

function toItem(template: DocTemplate, included: boolean): DocItem {
  return {
    ...template,
    included,
    status: "pendente",
    expiresAt: "",
    submittedBy: "cliente",
    validatedBy: "backoffice",
    notes: "",
    file: null,
  };
}

/** Documentos que se aplicam ao perfil atual (condicionais sugeridos automaticamente). */
export function suggestedConditionalKeys(state: RegistrationState): string[] {
  if (state.personType === "pj") return [];
  const keys: string[] = [];
  if (state.pf.maritalStatus === "casado") keys.push("pf_casamento", "pf_conjuge_doc");
  if (state.pf.maritalStatus === "uniao_estavel") keys.push("pf_uniao", "pf_conjuge_doc");
  return keys;
}

export function buildDocumentChecklist(personType: PersonType): DocItem[] {
  const source = personType === "pf" ? PF_DOCS : PJ_DOCS;
  return source.map((t) => toItem(t, t.requirement === "cadastro"));
}

// ---------------------------------------------------------------------------
// Estado do formulário
// ---------------------------------------------------------------------------

export type ExtraContact = { id: string; type: string; value: string; label: string; notes: string };

export type FamilyMember = {
  id: string;
  relationship: string;
  name: string;
  cpf: string;
  birthDate: string;
};

export type Partner = { id: string; name: string; document: string; share: string; role: string };

export type RegistrationState = {
  personType: PersonType;
  relationshipType: RelationshipType;
  pf: {
    fullName: string;
    socialName: string;
    cpf: string;
    birthDate: string;
    sex: string;
    nationality: string;
    birthplace: string;
    maritalStatus: MaritalStatus;
    profession: string;
    idDocType: string;
    idDocNumber: string;
    idDocIssuer: string;
    idDocUf: string;
    idDocIssueDate: string;
  };
  pj: {
    legalName: string;
    tradeName: string;
    cnpj: string;
    foundationDate: string;
    legalNature: string;
    cnae: string;
    mainActivity: string;
    website: string;
    revenue: string;
    netWorth: string;
    fundsOrigin: string;
    repName: string;
    repCpf: string;
    repRole: string;
    repEmail: string;
    repPhone: string;
    partners: Partner[];
  };
  contact: { email: string; mobile: string; whatsapp: string; whatsappSameAsMobile: boolean };
  address: {
    postalCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    residenceType: string;
  };
  extraContacts: ExtraContact[];
  profile: {
    professionalStatus: string;
    company: string;
    companyCnpj: string;
    role: string;
    activityTime: string;
    monthlyIncome: string;
    otherIncome: string;
    familyIncome: string;
    estimatedNetWorth: string;
    incomeSources: string[];
    fundsOrigins: string[];
  };
  compliance: { riskClassification: string; fundsOriginDetail: string; beneficialOwner: string; notes: string };
  family: {
    hasSpouse: boolean;
    spouse: {
      name: string;
      cpf: string;
      birthDate: string;
      profession: string;
      phone: string;
      email: string;
      propertyRegime: string;
    };
    members: FamilyMember[];
  };
  documents: DocItem[];
  notes: string;
};

export function createInitialState(personType: PersonType = "pf"): RegistrationState {
  return {
    personType,
    relationshipType: "cliente",
    pf: {
      fullName: "",
      socialName: "",
      cpf: "",
      birthDate: "",
      sex: "",
      nationality: "Brasileira",
      birthplace: "",
      maritalStatus: "",
      profession: "",
      idDocType: "RG",
      idDocNumber: "",
      idDocIssuer: "",
      idDocUf: "",
      idDocIssueDate: "",
    },
    pj: {
      legalName: "",
      tradeName: "",
      cnpj: "",
      foundationDate: "",
      legalNature: "",
      cnae: "",
      mainActivity: "",
      website: "",
      revenue: "",
      netWorth: "",
      fundsOrigin: "",
      repName: "",
      repCpf: "",
      repRole: "",
      repEmail: "",
      repPhone: "",
      partners: [],
    },
    contact: { email: "", mobile: "", whatsapp: "", whatsappSameAsMobile: true },
    address: {
      postalCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "Brasil",
      residenceType: "",
    },
    extraContacts: [],
    profile: {
      professionalStatus: "",
      company: "",
      companyCnpj: "",
      role: "",
      activityTime: "",
      monthlyIncome: "",
      otherIncome: "",
      familyIncome: "",
      estimatedNetWorth: "",
      incomeSources: [],
      fundsOrigins: [],
    },
    compliance: { riskClassification: "", fundsOriginDetail: "", beneficialOwner: "", notes: "" },
    family: {
      hasSpouse: false,
      spouse: { name: "", cpf: "", birthDate: "", profession: "", phone: "", email: "", propertyRegime: "" },
      members: [],
    },
    documents: buildDocumentChecklist(personType),
    notes: "",
  };
}

export function hasSpouseByMaritalStatus(status: MaritalStatus): boolean {
  return status === "casado" || status === "uniao_estavel";
}

// ---------------------------------------------------------------------------
// Máscaras
// ---------------------------------------------------------------------------

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskCpfOrCnpj(value: string): string {
  return onlyDigits(value).length > 11 ? maskCnpj(value) : maskCpf(value);
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Máscara monetária simples ("1234567" → "12.345,67"). */
export function maskMoney(value: string): string {
  const d = onlyDigits(value).replace(/^0+(?=\d)/, "");
  if (!d) return "";
  const cents = d.padStart(3, "0");
  const int = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${cents.slice(-2)}`;
}

export function parseMoney(value: string): number | null {
  if (!value) return null;
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Validadores
// ---------------------------------------------------------------------------

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Telefone brasileiro: DDD válido + 8 dígitos (fixo) ou 9 dígitos iniciando em 9 (celular). */
export function isValidPhone(value: string, { mobileOnly = false } = {}): boolean {
  const d = onlyDigits(value);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11) return d[2] === "9";
  return !mobileOnly;
}

export function isValidCep(value: string): boolean {
  return onlyDigits(value).length === 8;
}

function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPastDate(value: string): boolean {
  const date = parseDate(value);
  return !!date && date.getTime() <= Date.now() && date.getFullYear() >= 1900;
}

export function ageFrom(value: string): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--;
  return age;
}

export function isExpiredDate(value: string): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

// ---------------------------------------------------------------------------
// Validação por etapa
// ---------------------------------------------------------------------------

export type FieldErrors = Record<string, string>;

export const STEPS = [
  { key: "tipo", label: "Tipo" },
  { key: "identificacao", label: "Identificação" },
  { key: "contatos", label: "Contatos" },
  { key: "perfil", label: "Perfil" },
  { key: "familia", label: "Família" },
  { key: "documentos", label: "Documentos" },
  { key: "revisao", label: "Revisão" },
] as const;

const REQUIRED = "Campo obrigatório.";

function requireText(errors: FieldErrors, key: string, value: string, message = REQUIRED) {
  if (!value.trim()) errors[key] = message;
}

function optionalCheck(errors: FieldErrors, key: string, value: string, valid: boolean, message: string) {
  if (value.trim() && !valid) errors[key] = message;
}

export function validateStep(step: number, s: RegistrationState): FieldErrors {
  const e: FieldErrors = {};

  if (step === 0) {
    if (!s.personType) e.personType = "Selecione o tipo de cliente.";
    if (!s.relationshipType) e.relationshipType = "Selecione o tipo de relacionamento.";
  }

  if (step === 1) {
    if (s.personType === "pf") {
      const p = s.pf;
      if (!p.fullName.trim()) e["pf.fullName"] = REQUIRED;
      else if (p.fullName.trim().split(/\s+/).length < 2) e["pf.fullName"] = "Informe nome e sobrenome.";
      if (!p.cpf.trim()) e["pf.cpf"] = REQUIRED;
      else if (!isValidCpf(p.cpf)) e["pf.cpf"] = "CPF inválido. Confira os dígitos.";
      if (!p.birthDate) e["pf.birthDate"] = REQUIRED;
      else if (!isPastDate(p.birthDate)) e["pf.birthDate"] = "Data de nascimento inválida.";
      else if ((ageFrom(p.birthDate) ?? 0) > 120) e["pf.birthDate"] = "Data de nascimento fora do intervalo aceito.";
      if (!p.maritalStatus) e["pf.maritalStatus"] = "Selecione o estado civil.";
      if (p.idDocIssueDate && !isPastDate(p.idDocIssueDate)) e["pf.idDocIssueDate"] = "Data de emissão inválida.";
      if (p.idDocIssueDate && p.birthDate && p.idDocIssueDate < p.birthDate)
        e["pf.idDocIssueDate"] = "A emissão não pode ser anterior ao nascimento.";
    } else {
      const j = s.pj;
      requireText(e, "pj.legalName", j.legalName);
      if (!j.cnpj.trim()) e["pj.cnpj"] = REQUIRED;
      else if (!isValidCnpj(j.cnpj)) e["pj.cnpj"] = "CNPJ inválido. Confira os dígitos.";
      if (j.foundationDate && !isPastDate(j.foundationDate)) e["pj.foundationDate"] = "Data de constituição inválida.";
      optionalCheck(e, "pj.website", j.website, /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(j.website.trim()), "Endereço de site inválido.");
      requireText(e, "pj.repName", j.repName, "Informe o representante legal.");
      if (!j.repCpf.trim()) e["pj.repCpf"] = REQUIRED;
      else if (!isValidCpf(j.repCpf)) e["pj.repCpf"] = "CPF inválido.";
      optionalCheck(e, "pj.repEmail", j.repEmail, isValidEmail(j.repEmail), "E-mail inválido.");
      optionalCheck(e, "pj.repPhone", j.repPhone, isValidPhone(j.repPhone), "Telefone inválido.");
      j.partners.forEach((p) => {
        if (!p.name.trim()) e[`partner.${p.id}.name`] = REQUIRED;
        const digits = onlyDigits(p.document);
        if (digits && !(digits.length === 11 ? isValidCpf(digits) : isValidCnpj(digits)))
          e[`partner.${p.id}.document`] = "CPF/CNPJ inválido.";
        const share = Number(p.share.replace(",", "."));
        if (p.share && (!Number.isFinite(share) || share <= 0 || share > 100))
          e[`partner.${p.id}.share`] = "Entre 0 e 100.";
      });
      const total = j.partners.reduce((acc, p) => acc + (Number(p.share.replace(",", ".")) || 0), 0);
      if (total > 100.0001) e["pj.partners"] = "A soma das participações passa de 100%.";
    }
  }

  if (step === 2) {
    const c = s.contact;
    if (!c.email.trim()) e["contact.email"] = REQUIRED;
    else if (!isValidEmail(c.email)) e["contact.email"] = "E-mail inválido.";
    if (!c.mobile.trim()) e["contact.mobile"] = REQUIRED;
    else if (!isValidPhone(c.mobile, { mobileOnly: s.personType === "pf" }))
      e["contact.mobile"] = s.personType === "pf" ? "Celular inválido. Use DDD + 9 dígitos." : "Telefone inválido.";
    if (!c.whatsappSameAsMobile) optionalCheck(e, "contact.whatsapp", c.whatsapp, isValidPhone(c.whatsapp), "WhatsApp inválido.");

    const a = s.address;
    if (!a.postalCode.trim()) e["address.postalCode"] = REQUIRED;
    else if (!isValidCep(a.postalCode)) e["address.postalCode"] = "CEP deve ter 8 dígitos.";
    requireText(e, "address.street", a.street);
    requireText(e, "address.number", a.number);
    requireText(e, "address.neighborhood", a.neighborhood);
    requireText(e, "address.city", a.city);
    requireText(e, "address.state", a.state);
    requireText(e, "address.country", a.country);

    s.extraContacts.forEach((x) => {
      if (!x.value.trim()) e[`extra.${x.id}.value`] = REQUIRED;
      else if (x.type === "email" && !isValidEmail(x.value)) e[`extra.${x.id}.value`] = "E-mail inválido.";
      else if (x.type !== "email" && !isValidPhone(x.value)) e[`extra.${x.id}.value`] = "Telefone inválido.";
    });
  }

  if (step === 3) {
    const p = s.profile;
    optionalCheck(e, "profile.companyCnpj", p.companyCnpj, isValidCnpj(p.companyCnpj), "CNPJ inválido.");
  }

  if (step === 4 && s.personType === "pf") {
    if (s.family.hasSpouse) {
      const sp = s.family.spouse;
      requireText(e, "spouse.name", sp.name, "Informe o nome do cônjuge/companheiro(a).");
      optionalCheck(e, "spouse.cpf", sp.cpf, isValidCpf(sp.cpf), "CPF inválido.");
      if (sp.cpf && onlyDigits(sp.cpf) === onlyDigits(s.pf.cpf)) e["spouse.cpf"] = "O CPF é o mesmo do titular.";
      optionalCheck(e, "spouse.birthDate", sp.birthDate, isPastDate(sp.birthDate), "Data inválida.");
      optionalCheck(e, "spouse.email", sp.email, isValidEmail(sp.email), "E-mail inválido.");
      optionalCheck(e, "spouse.phone", sp.phone, isValidPhone(sp.phone), "Telefone inválido.");
    }
    s.family.members.forEach((m) => {
      if (!m.name.trim()) e[`member.${m.id}.name`] = REQUIRED;
      if (!m.relationship) e[`member.${m.id}.relationship`] = "Selecione o vínculo.";
      optionalCheck(e, `member.${m.id}.cpf`, m.cpf, isValidCpf(m.cpf), "CPF inválido.");
      optionalCheck(e, `member.${m.id}.birthDate`, m.birthDate, isPastDate(m.birthDate), "Data inválida.");
    });
  }

  if (step === 5) {
    s.documents.forEach((d) => {
      if (!d.included) return;
      if (d.key.startsWith("avulso_") && !d.name.trim()) e[`doc.${d.key}.name`] = "Informe o nome do documento.";
      if (d.status === "expirado" && !d.expiresAt) e[`doc.${d.key}.expiresAt`] = "Informe a validade vencida.";
    });
  }

  return e;
}

/** Valida todas as etapas de dados (usado na revisão e no servidor). */
export function validateAll(s: RegistrationState): { step: number; errors: FieldErrors }[] {
  const out: { step: number; errors: FieldErrors }[] = [];
  for (let i = 0; i < STEPS.length - 1; i++) {
    const errors = validateStep(i, s);
    if (Object.keys(errors).length > 0) out.push({ step: i, errors });
  }
  return out;
}

/** Pendências não bloqueantes (dados opcionais recomendados), mostradas na revisão. */
export function softPendencies(s: RegistrationState): string[] {
  const list: string[] = [];
  if (s.personType === "pf") {
    if (!s.pf.idDocNumber.trim()) list.push("Número do documento de identificação não informado.");
    if (!s.pf.profession.trim()) list.push("Profissão não informada.");
  } else {
    if (!s.pj.cnae.trim()) list.push("CNAE não informado.");
    if (s.pj.partners.length === 0) list.push("Nenhum sócio/beneficiário cadastrado.");
  }
  if (!s.profile.monthlyIncome && s.personType === "pf") list.push("Renda mensal não informada.");
  if (!s.profile.estimatedNetWorth && !s.pj.netWorth) list.push("Patrimônio estimado não informado.");
  if (s.profile.fundsOrigins.length === 0 && !s.pj.fundsOrigin) list.push("Fonte dos recursos não informada.");
  if (!s.compliance.riskClassification) list.push("Classificação de risco não definida.");
  const missingRequiredDocs = s.documents.filter(
    (d) => d.requirement === "cadastro" && d.included && d.status === "pendente" && !d.file,
  ).length;
  if (missingRequiredDocs > 0)
    list.push(
      `${missingRequiredDocs} ${missingRequiredDocs === 1 ? "documento obrigatório para cadastro ainda pendente" : "documentos obrigatórios para cadastro ainda pendentes"} (serão solicitados).`,
    );
  return list;
}

export function clientDisplayName(s: RegistrationState): string {
  return s.personType === "pf" ? s.pf.fullName.trim() : s.pj.legalName.trim();
}

export function clientDocument(s: RegistrationState): string {
  return s.personType === "pf" ? maskCpf(s.pf.cpf) : maskCnpj(s.pj.cnpj);
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
