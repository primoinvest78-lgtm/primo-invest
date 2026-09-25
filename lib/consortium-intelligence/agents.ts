/**
 * Agentes especializados — cada um com ferramentas LIMITADAS. Nenhum
 * agente gigante. Os efeitos permitidos são só LER, ANALISAR,
 * EXPLICAR, SUGERIR, ALERTAR, SIMULAR e propor RASCUNHO. As ações
 * proibidas são checadas no registro de ferramentas: nenhuma
 * ferramenta com efeito proibido existe, então nenhum agente (nem um
 * futuro modelo de linguagem) consegue executá-las.
 */

export type ToolEffect = "READ" | "SIMULATE" | "DRAFT";

export const FORBIDDEN_FOR_AI = [
  "Publicar regra",
  "Alterar resultado oficial",
  "Aprovar retificação",
  "Alterar histórico",
  "Modificar auditoria",
  "Liberar crédito",
  "Homologar assembleia",
] as const;

export const TOOL_NAMES = [
  "getAssembly",
  "getRule",
  "getRuleVersions",
  "getLotteryResult",
  "getEligibilitySnapshot",
  "getCalculationTrace",
  "getContemplation",
  "explainQuota",
  "getAuditTrail",
  "getFindings",
  "getCreditPosition",
  "runSimulation",
  "reproduceCalculation",
  "proposeRuleDraftFromText",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export type AgentDefinition = {
  id: string;
  name: string;
  mission: string;
  tools: ToolName[];
};

export const AGENTS: AgentDefinition[] = [
  {
    id: "RULE_AGENT",
    name: "Agente de regras",
    mission: "Explica regras e versões, compara versões e aponta impacto. Não publica nem altera regra.",
    tools: ["getRule", "getRuleVersions", "getAuditTrail"],
  },
  {
    id: "ASSEMBLY_AGENT",
    name: "Agente de assembleias",
    mission: "Explica a apuração: números apurados, cotas testadas, motivos, substituições e contemplações.",
    tools: ["getAssembly", "getCalculationTrace", "getContemplation", "explainQuota", "getLotteryResult", "getEligibilitySnapshot"],
  },
  {
    id: "DATA_AGENT",
    name: "Agente de dados",
    mission: "Responde sobre elegibilidade, recursos e resultado oficial a partir dos snapshots congelados.",
    tools: ["getEligibilitySnapshot", "getLotteryResult", "getAssembly"],
  },
  {
    id: "AUDIT_AGENT",
    name: "Agente de auditoria",
    mission: "Responde quem fez o quê e quando, qual versão estava publicada, se houve retificação, e reproduz cálculos.",
    tools: ["getAuditTrail", "getRuleVersions", "reproduceCalculation"],
  },
  {
    id: "ANOMALY_AGENT",
    name: "Agente de anomalias",
    mission: "Lista e explica achados do motor de anomalias e sugere investigação. Não resolve achados sozinho.",
    tools: ["getFindings", "reproduceCalculation", "getAssembly"],
  },
  {
    id: "DOCUMENT_AGENT",
    name: "Agente de documentos",
    mission: "Extrai regras candidatas de regulamentos — sempre como RASCUNHO para revisão humana.",
    tools: ["proposeRuleDraftFromText", "getRule"],
  },
  {
    id: "FINANCIAL_AGENT",
    name: "Agente financeiro",
    mission: "Explica crédito líquido, lance, amortização, quitação e saldo; simula cenários sem gravar.",
    tools: ["getCreditPosition", "runSimulation"],
  },
];

export const TOOL_EFFECT: Record<ToolName, ToolEffect> = {
  getAssembly: "READ",
  getRule: "READ",
  getRuleVersions: "READ",
  getLotteryResult: "READ",
  getEligibilitySnapshot: "READ",
  getCalculationTrace: "READ",
  getContemplation: "READ",
  explainQuota: "READ",
  getAuditTrail: "READ",
  getFindings: "READ",
  getCreditPosition: "READ",
  runSimulation: "SIMULATE",
  reproduceCalculation: "SIMULATE",
  proposeRuleDraftFromText: "DRAFT",
};

/** Esquemas no formato de ferramentas de modelos de linguagem (tool use). */
export const TOOL_SCHEMAS: Record<ToolName, { description: string; parameters: Record<string, unknown> }> = {
  getAssembly: { description: "Dados e estado de uma assembleia, recursos e contemplações vigentes.", parameters: { type: "object", properties: { assemblyId: { type: "string" } }, required: ["assemblyId"] } },
  getRule: { description: "Regra (versão exata) com configuração e hash.", parameters: { type: "object", properties: { ruleId: { type: "string" } }, required: ["ruleId"] } },
  getRuleVersions: { description: "Todas as versões de uma regra, com status e assembleias que usaram cada uma.", parameters: { type: "object", properties: { ruleKey: { type: "string" } }, required: ["ruleKey"] } },
  getLotteryResult: { description: "Resultado oficial congelado usado na assembleia.", parameters: { type: "object", properties: { assemblyId: { type: "string" } }, required: ["assemblyId"] } },
  getEligibilitySnapshot: { description: "Snapshot de elegibilidade congelado (cotas aptas/inaptas e motivos).", parameters: { type: "object", properties: { assemblyId: { type: "string" }, onlyIneligible: { type: "boolean" } }, required: ["assemblyId"] } },
  getCalculationTrace: { description: "Trilha completa do cálculo (prova).", parameters: { type: "object", properties: { assemblyId: { type: "string" }, phase: { type: "string", enum: ["DRAW", "BIDS"] } }, required: ["assemblyId"] } },
  getContemplation: { description: "Contemplações da assembleia com tipo, via e status.", parameters: { type: "object", properties: { assemblyId: { type: "string" } }, required: ["assemblyId"] } },
  explainQuota: { description: "Por que uma cota foi ou não contemplada: tentativas, elegibilidade e motivo.", parameters: { type: "object", properties: { assemblyId: { type: "string" }, quotaNumber: { type: "number" } }, required: ["assemblyId", "quotaNumber"] } },
  getAuditTrail: { description: "Eventos de auditoria encadeados por hash de uma entidade.", parameters: { type: "object", properties: { entityId: { type: "string" }, assemblyId: { type: "string" } } } },
  getFindings: { description: "Achados do motor de anomalias (abertos por padrão).", parameters: { type: "object", properties: { assemblyId: { type: "string" } } } },
  getCreditPosition: { description: "Crédito contratado/atualizado/lance/embutido/líquido/usado e saldo devedor.", parameters: { type: "object", properties: { creditOperationId: { type: "string" } }, required: ["creditOperationId"] } },
  runSimulation: { description: "Simula cenário sem alterar resultado oficial.", parameters: { type: "object", properties: { assemblyId: { type: "string" }, scenario: { type: "object" } }, required: ["assemblyId", "scenario"] } },
  reproduceCalculation: { description: "Reexecuta um cálculo com os mesmos snapshots e compara hashes.", parameters: { type: "object", properties: { assemblyId: { type: "string" }, runId: { type: "string" } }, required: ["assemblyId", "runId"] } },
  proposeRuleDraftFromText: { description: "Extrai configuração candidata de regulamento. Resultado é RASCUNHO.", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
};

/** Garante que nenhum agente tenha ferramenta fora do registro. */
export function agentCanUse(agentId: string, tool: ToolName): boolean {
  return AGENTS.find((a) => a.id === agentId)?.tools.includes(tool) ?? false;
}

/** Nome legível de cada ferramenta (o identificador técnico nunca aparece na tela). */
export const TOOL_LABEL: Record<ToolName, string> = {
  getAssembly: "Consultar assembleia",
  getRule: "Consultar regra",
  getRuleVersions: "Consultar versões da regra",
  getLotteryResult: "Consultar resultado oficial",
  getEligibilitySnapshot: "Consultar elegibilidade",
  getCalculationTrace: "Consultar cálculo",
  getContemplation: "Consultar contemplações",
  explainQuota: "Explicar cota",
  getAuditTrail: "Consultar auditoria",
  getFindings: "Consultar achados",
  getCreditPosition: "Consultar crédito",
  runSimulation: "Simular cenário",
  reproduceCalculation: "Reproduzir cálculo",
  proposeRuleDraftFromText: "Propor regra a partir de documento",
};

export const EFFECT_LABEL: Record<ToolEffect, string> = {
  READ: "somente leitura",
  SIMULATE: "simulação sem gravar resultado",
  DRAFT: "cria apenas rascunho",
};
