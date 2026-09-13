export const LEAD_STATUSES = ["Novo", "Contatado", "Qualificado", "Convertido", "Perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
