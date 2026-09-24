/**
 * Máquina de estados da assembleia. Espelha EXATAMENTE o trigger
 * `consortium_assembly_guard` do banco — a UI usa esta cópia pra só
 * oferecer ações possíveis; o banco é quem garante.
 */

export const ASSEMBLY_STATUSES = [
  "SCHEDULED",
  "PREPARING",
  "ELIGIBILITY_LOCKED",
  "LOTTERY_LOCKED",
  "DRAW_READY",
  "DRAWING",
  "DRAW_COMPLETED",
  "BID_PROCESSING",
  "HOMOLOGATION",
  "COMPLETED",
  "LOCKED",
  "RETIFIED",
] as const;
export type AssemblyStatus = (typeof ASSEMBLY_STATUSES)[number];

export const ASSEMBLY_TRANSITIONS: Record<AssemblyStatus, AssemblyStatus[]> = {
  SCHEDULED: ["PREPARING"],
  PREPARING: ["SCHEDULED", "ELIGIBILITY_LOCKED"],
  ELIGIBILITY_LOCKED: ["LOTTERY_LOCKED"],
  LOTTERY_LOCKED: ["DRAW_READY"],
  DRAW_READY: ["DRAWING"],
  DRAWING: ["DRAW_COMPLETED"],
  DRAW_COMPLETED: ["BID_PROCESSING", "HOMOLOGATION"],
  BID_PROCESSING: ["HOMOLOGATION"],
  HOMOLOGATION: ["COMPLETED"],
  COMPLETED: ["LOCKED", "RETIFIED"],
  LOCKED: ["RETIFIED"],
  RETIFIED: ["LOCKED"],
};

export function canTransitionAssembly(from: AssemblyStatus, to: AssemblyStatus): boolean {
  return ASSEMBLY_TRANSITIONS[from].includes(to);
}

export function assertAssemblyTransition(from: AssemblyStatus, to: AssemblyStatus): void {
  if (!canTransitionAssembly(from, to)) {
    throw new Error(`Operação incompatível com o estado da assembleia: ${ASSEMBLY_STATUS_LABEL[from]} → ${ASSEMBLY_STATUS_LABEL[to]}.`);
  }
}

export const ASSEMBLY_STATUS_LABEL: Record<AssemblyStatus, string> = {
  SCHEDULED: "Agendada",
  PREPARING: "Em preparação",
  ELIGIBILITY_LOCKED: "Elegibilidade travada",
  LOTTERY_LOCKED: "Resultado travado",
  DRAW_READY: "Pronta para apuração",
  DRAWING: "Apurando",
  DRAW_COMPLETED: "Sorteio apurado",
  BID_PROCESSING: "Lances apurados",
  HOMOLOGATION: "Em homologação",
  COMPLETED: "Homologada",
  LOCKED: "Travada",
  RETIFIED: "Retificada",
};

/** Ordem visual das etapas operacionais (pra linha do tempo da tela). */
export const ASSEMBLY_PIPELINE: AssemblyStatus[] = [
  "SCHEDULED",
  "PREPARING",
  "ELIGIBILITY_LOCKED",
  "LOTTERY_LOCKED",
  "DRAW_READY",
  "DRAW_COMPLETED",
  "BID_PROCESSING",
  "HOMOLOGATION",
  "COMPLETED",
  "LOCKED",
];

export function pipelineIndex(status: AssemblyStatus): number {
  if (status === "DRAWING") return ASSEMBLY_PIPELINE.indexOf("DRAW_READY");
  if (status === "RETIFIED") return ASSEMBLY_PIPELINE.length - 1;
  return ASSEMBLY_PIPELINE.indexOf(status);
}
