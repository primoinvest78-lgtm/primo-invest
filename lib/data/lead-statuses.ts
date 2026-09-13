export const LEAD_STATUSES = [
  "Novo",
  "Contato",
  "Qualificação",
  "Reunião",
  "Proposta",
  "Negociação",
  "Convertido",
  "Perdido",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Etapas "abertas" do funil — exclui os estados terminais. */
export const OPEN_LEAD_STATUSES = LEAD_STATUSES.filter(
  (status) => status !== "Convertido" && status !== "Perdido",
);

export const LOST_REASONS = [
  "Sem orçamento",
  "Sem interesse no momento",
  "Escolheu concorrente",
  "Sem resposta / sumiu",
  "Perfil fora do público-alvo",
  "Outro",
] as const;
