/**
 * Tipos centrais da Central de Inteligência.
 *
 * Um `Insight` nunca é uma segunda fonte de dado — é sempre a leitura
 * de um fato que já existe em algum módulo (tarefa atrasada, meta em
 * risco, documento vencendo etc.), rotulado com a taxonomia que o
 * módulo pede (Atenção / Oportunidade / Pendência / Informação) e com
 * rastreabilidade completa até a origem (`dataUsed`, `date`, `reason`).
 */

export type InsightType = "atencao" | "oportunidade" | "pendencia" | "informacao";

export const INSIGHT_TYPE_LABEL: Record<InsightType, string> = {
  atencao: "Atenção",
  oportunidade: "Oportunidade",
  pendencia: "Pendência",
  informacao: "Informação",
};

export type InsightPriority = "alta" | "media" | "baixa";

export const INSIGHT_PRIORITY_LABEL: Record<InsightPriority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export type InsightStatus = "aberto" | "resolvido" | "ignorado";

export const INSIGHT_STATUS_LABEL: Record<InsightStatus, string> = {
  aberto: "Em aberto",
  resolvido: "Resolvido",
  ignorado: "Ignorado",
};

export type InsightSourceModule =
  | "tarefas"
  | "leads"
  | "oportunidades"
  | "clientes"
  | "metas"
  | "passivos"
  | "consorcios"
  | "documentos"
  | "patrimonio"
  | "integracoes";

export const SOURCE_MODULE_LABEL: Record<InsightSourceModule, string> = {
  tarefas: "Tarefas",
  leads: "Leads",
  oportunidades: "Oportunidades",
  clientes: "Clientes",
  metas: "Metas",
  passivos: "Passivos",
  consorcios: "Consórcios",
  documentos: "Documentos",
  patrimonio: "Patrimônio",
  integracoes: "Integrações",
};

/** Um dado real usado para gerar o insight — nunca um número calculado à parte. */
export type InsightDataPoint = { label: string; value: string };

export type Insight = {
  /** Determinístico e estável entre renderizações — é a chave de persistência de status. */
  key: string;
  title: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  sourceModule: InsightSourceModule;
  /** Onde ver o registro de origem. */
  sourceHref: string;
  clientId: string | null;
  clientName: string | null;
  reason: string;
  dataUsed: InsightDataPoint[];
  /** Data do fato que gerou o insight (vencimento, última atividade etc.), não a data de cálculo. */
  date: string;
  /** Rótulo curto e determinístico — nunca uma ação executada sozinha. */
  suggestedAction: string;
};

export type InsightCounts = Record<InsightType, number>;
