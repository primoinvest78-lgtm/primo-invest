export const REPORT_TYPES = ["patrimonial", "investimentos", "cliente", "consorcios", "operacional", "executivo"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  patrimonial: "Patrimonial",
  investimentos: "Investimentos",
  cliente: "Cliente",
  consorcios: "Consórcios",
  operacional: "Operacional",
  executivo: "Executivo",
};

export const REPORT_TYPE_DESCRIPTION: Record<ReportType, string> = {
  patrimonial: "Visão patrimonial, patrimônio líquido, ativos, passivos e evolução.",
  investimentos: "Carteira, alocação, ranking por instituição, posições e movimentações.",
  cliente: "Visão 360° de um cliente: patrimônio, metas, consórcios, oportunidades.",
  consorcios: "Contratos, parcelas em aberto, lances e contemplações.",
  operacional: "Tarefas, leads, oportunidades e produtividade interna.",
  executivo: "Indicadores gerais, evolução e visão consolidada da organização.",
};

/** true = a Central exige um cliente selecionado pra este tipo (não faz sentido sem escopo). */
export const REPORT_TYPE_REQUIRES_CLIENT: Record<ReportType, boolean> = {
  patrimonial: false,
  investimentos: false,
  cliente: true,
  consorcios: false,
  operacional: false,
  executivo: false,
};

/** false = tipo não aceita recorte por cliente (visão sempre consolidada da organização). */
export const REPORT_TYPE_ALLOWS_CLIENT: Record<ReportType, boolean> = {
  patrimonial: true,
  investimentos: true,
  cliente: true,
  consorcios: true,
  operacional: false,
  executivo: false,
};

export const REPORT_TYPE_ALLOWS_PERIOD: Record<ReportType, boolean> = {
  patrimonial: true,
  investimentos: true,
  cliente: true,
  consorcios: true,
  operacional: true,
  executivo: true,
};

export const REPORT_TYPE_ALLOWS_INSTITUTION: Record<ReportType, boolean> = {
  patrimonial: false,
  investimentos: true,
  cliente: false,
  consorcios: false,
  operacional: false,
  executivo: false,
};

export type ReportSectionOption = { id: string; label: string };

export const REPORT_TYPE_SECTIONS: Record<ReportType, ReportSectionOption[]> = {
  patrimonial: [
    { id: "kpis", label: "Indicadores gerais" },
    { id: "evolucao", label: "Evolução patrimonial" },
    { id: "alocacao", label: "Alocação de ativos" },
    { id: "contas", label: "Contas" },
    { id: "passivos", label: "Passivos" },
  ],
  investimentos: [
    { id: "kpis", label: "Indicadores gerais" },
    { id: "alocacao", label: "Alocação por tipo de produto" },
    { id: "ranking", label: "Ranking por instituição" },
    { id: "posicoes", label: "Posições" },
    { id: "movimentacoes", label: "Movimentações recentes" },
  ],
  cliente: [
    { id: "kpis", label: "Indicadores gerais" },
    { id: "evolucao", label: "Evolução patrimonial" },
    { id: "alocacao", label: "Alocação de ativos" },
    { id: "contas", label: "Contas" },
    { id: "metas", label: "Metas" },
    { id: "consorcios", label: "Consórcios" },
    { id: "passivos", label: "Passivos" },
    { id: "oportunidades", label: "Oportunidades" },
    { id: "perfil", label: "Perfil de risco" },
  ],
  consorcios: [
    { id: "kpis", label: "Indicadores gerais" },
    { id: "status", label: "Contratos por status" },
    { id: "ranking", label: "Ranking de crédito por cliente" },
    { id: "contratos", label: "Contratos" },
    { id: "parcelas", label: "Parcelas em aberto" },
    { id: "lances", label: "Lances recentes" },
  ],
  operacional: [
    { id: "kpis", label: "Indicadores gerais" },
    { id: "tarefas_status", label: "Tarefas por status" },
    { id: "pipeline", label: "Pipeline de oportunidades" },
    { id: "tarefas_atraso", label: "Tarefas em atraso" },
    { id: "oportunidades_abertas", label: "Oportunidades abertas" },
    { id: "leads_origem", label: "Leads por origem" },
  ],
  executivo: [
    { id: "kpis", label: "Indicadores gerais" },
    { id: "evolucao", label: "Evolução patrimonial" },
    { id: "alocacao", label: "Alocação de ativos" },
    { id: "pipeline", label: "Pipeline de oportunidades" },
    { id: "top_clientes", label: "Top clientes por patrimônio" },
  ],
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  gerado: "Gerado",
  agendado: "Agendado",
  falhou: "Falhou",
};

export type ReportKpi = { label: string; value: string; sub?: string | null };
export type ReportChartPoint = { label: string; value: number };
export type ReportChart = {
  id: string;
  kind: "line" | "bar" | "bar-horizontal" | "donut";
  title: string;
  data: ReportChartPoint[];
};
export type ReportTable = {
  id: string;
  title: string;
  columns: string[];
  rows: (string | number)[][];
  /**
   * Rota de origem de cada linha, na mesma ordem de `rows` (null quando
   * a linha é um agregado sem registro único). É isso que transforma o
   * relatório num documento NAVEGÁVEL: da tabela o usuário salta direto
   * pro contrato, conta ou cliente que gerou aquele número, sem precisar
   * procurar no módulo. Gravado junto no snapshot, então continua
   * funcionando ao reabrir um relatório antigo.
   */
  links?: (string | null)[];
  note?: string;
};

/** De onde vieram os números desta seção, dentro da própria plataforma. */
export type ReportSource = {
  label: string;
  href: string;
};

export type ReportSection = {
  id: string;
  title: string;
  kpis?: ReportKpi[];
  charts?: ReportChart[];
  tables?: ReportTable[];
  /** Módulo que é a fonte de verdade desta seção (rastreabilidade + navegação). */
  source?: ReportSource;
  note?: string;
};

export type ReportPayload = {
  type: ReportType;
  title: string;
  subtitle: string | null;
  clientName: string | null;
  periodLabel: string | null;
  generatedAt: string;
  sections: ReportSection[];
};

export type ReportParameters = {
  clientId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  institution: string | null;
  sections: string[];
};

/* ────────────────────────────────────────────────────────────────
 * Compartilhamento, agendamento e templates
 * ──────────────────────────────────────────────────────────────── */

export const SHARE_AUDIENCES = ["advisor", "team", "client", "administrator", "third_party"] as const;
export type ShareAudience = (typeof SHARE_AUDIENCES)[number];

export const SHARE_AUDIENCE_LABEL: Record<ShareAudience, string> = {
  advisor: "Assessor",
  team: "Equipe interna",
  client: "Cliente",
  administrator: "Administração",
  third_party: "Terceiro autorizado",
};

export const SCHEDULE_FREQUENCIES = ["mensal", "trimestral", "anual"] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export const SCHEDULE_FREQUENCY_LABEL: Record<ScheduleFrequency, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

export type ReportSchedule = {
  frequency: ScheduleFrequency;
  /** Dia do mês (1–28) em que a próxima emissão deve ser preparada. */
  dayOfMonth: number;
  nextRunOn: string;
  note: string | null;
};

/**
 * Público-alvo do documento. "cliente" remove do payload tudo que é
 * informação interna da casa (produtividade, leads, pipeline, ranking
 * de clientes) — ver applyAudienceScope em builders.ts.
 */
export const REPORT_AUDIENCES = ["interno", "cliente"] as const;
export type ReportAudience = (typeof REPORT_AUDIENCES)[number];

export const REPORT_AUDIENCE_LABEL: Record<ReportAudience, string> = {
  interno: "Interno (assessor / gestor)",
  cliente: "Cliente",
};

/**
 * Seções que nunca entram num relatório com público "cliente" — por
 * tipo, porque o mesmo id muda de significado entre tipos ("ranking"
 * em Investimentos é por instituição, informação legítima do cliente;
 * em Consórcios é ranking de crédito ENTRE clientes, informação
 * interna da casa).
 */
export const INTERNAL_ONLY_SECTIONS: Record<ReportType, string[]> = {
  patrimonial: [],
  investimentos: [],
  cliente: ["oportunidades"],
  consorcios: ["ranking"],
  operacional: [],
  executivo: [],
};

/** Tipos que só existem pra consumo interno — nunca viram documento de cliente. */
export const INTERNAL_ONLY_TYPES: ReportType[] = ["operacional", "executivo"];
