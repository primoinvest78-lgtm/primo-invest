/**
 * Estado do gerador de relatórios.
 *
 * Fica fora do componente porque três lugares precisam da mesma lógica:
 * o wizard, os atalhos "Gerar relatório" que chegam de outros módulos
 * (via querystring) e os templates salvos. Um só lugar decide o que é
 * um recorte válido — evita que o link vindo da ficha do cliente monte
 * um estado que o wizard considera inválido.
 */

import {
  REPORT_TYPE_ALLOWS_CLIENT,
  REPORT_TYPE_ALLOWS_INSTITUTION,
  REPORT_TYPE_ALLOWS_PERIOD,
  REPORT_TYPE_REQUIRES_CLIENT,
  REPORT_TYPE_SECTIONS,
  REPORT_TYPES,
  INTERNAL_ONLY_SECTIONS,
  INTERNAL_ONLY_TYPES,
  type ReportAudience,
  type ReportType,
} from "@/lib/reports/types";

export type GeneratorState = {
  type: ReportType;
  title: string;
  audience: ReportAudience;
  clientId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  institution: string | null;
  sections: string[];
};

export function defaultTitleFor(type: ReportType, clientName?: string | null): string {
  const base: Record<ReportType, string> = {
    patrimonial: "Relatório Patrimonial",
    investimentos: "Relatório de Investimentos",
    cliente: "Relatório de Cliente",
    consorcios: "Relatório de Consórcios",
    operacional: "Relatório Operacional",
    executivo: "Relatório Executivo",
  };
  return clientName ? `${base[type]} · ${clientName}` : base[type];
}

export function allSectionsOf(type: ReportType): string[] {
  return REPORT_TYPE_SECTIONS[type].map((s) => s.id);
}

export function initialState(type: ReportType = "patrimonial"): GeneratorState {
  return {
    type,
    title: defaultTitleFor(type),
    audience: "interno",
    clientId: null,
    periodStart: null,
    periodEnd: null,
    institution: null,
    sections: allSectionsOf(type),
  };
}

/**
 * Trocar o tipo reinicia tudo que não faz sentido no tipo novo: seções
 * (são outras), cliente (se o tipo não aceita recorte) e instituição.
 * Carregar sobra do tipo anterior é o caminho mais curto para um
 * relatório que não corresponde ao que o usuário pediu.
 */
export function withType(state: GeneratorState, type: ReportType): GeneratorState {
  const keepClient = REPORT_TYPE_ALLOWS_CLIENT[type] ? state.clientId : null;
  const keepInstitution = REPORT_TYPE_ALLOWS_INSTITUTION[type] ? state.institution : null;
  const audience = INTERNAL_ONLY_TYPES.includes(type) ? "interno" : state.audience;

  return {
    ...state,
    type,
    audience,
    clientId: keepClient,
    institution: keepInstitution,
    sections: visibleSections(type, audience).map((s) => s.id),
    // Mantém um título customizado; substitui o que era só o padrão.
    title: isDefaultTitle(state.title) ? defaultTitleFor(type) : state.title,
  };
}

function isDefaultTitle(title: string): boolean {
  return REPORT_TYPES.some((t) => defaultTitleFor(t) === title);
}

/** Seções oferecidas — um documento de cliente não lista seção interna. */
export function visibleSections(type: ReportType, audience: ReportAudience) {
  const blocked = audience === "cliente" ? new Set(INTERNAL_ONLY_SECTIONS[type]) : new Set<string>();
  return REPORT_TYPE_SECTIONS[type].filter((s) => !blocked.has(s.id));
}

export function withAudience(state: GeneratorState, audience: ReportAudience): GeneratorState {
  const allowed = new Set(visibleSections(state.type, audience).map((s) => s.id));
  return {
    ...state,
    audience,
    sections: state.sections.filter((id) => allowed.has(id)),
  };
}

export function toggleSection(state: GeneratorState, sectionId: string): GeneratorState {
  const has = state.sections.includes(sectionId);
  return {
    ...state,
    sections: has
      ? state.sections.filter((id) => id !== sectionId)
      : // Mantém a ordem canônica do tipo, não a ordem dos cliques.
        allSectionsOf(state.type).filter((id) => id === sectionId || state.sections.includes(id)),
  };
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validate(state: GeneratorState): ValidationResult {
  if (!state.title.trim()) {
    return { ok: false, reason: "Dê um título ao relatório." };
  }
  if (REPORT_TYPE_REQUIRES_CLIENT[state.type] && !state.clientId) {
    return { ok: false, reason: "Este tipo de relatório exige um cliente selecionado." };
  }
  if (state.sections.length === 0) {
    return { ok: false, reason: "Selecione pelo menos uma seção." };
  }
  if (state.periodStart && state.periodEnd && state.periodStart > state.periodEnd) {
    return { ok: false, reason: "A data inicial do período é posterior à final." };
  }
  return { ok: true };
}

export const FILTER_SUPPORT = {
  client: REPORT_TYPE_ALLOWS_CLIENT,
  period: REPORT_TYPE_ALLOWS_PERIOD,
  institution: REPORT_TYPE_ALLOWS_INSTITUTION,
  requiresClient: REPORT_TYPE_REQUIRES_CLIENT,
};

/**
 * Reconstrói o estado a partir da querystring — é assim que os atalhos
 * "Gerar relatório" dos outros módulos abrem o wizard já configurado.
 * Parâmetro inválido é ignorado, nunca derruba a tela.
 */
export function stateFromParams(
  params: { tipo?: string; cliente?: string; inicio?: string; fim?: string; instituicao?: string; publico?: string },
  clientName?: string | null,
): GeneratorState {
  const type = (REPORT_TYPES as readonly string[]).includes(params.tipo ?? "")
    ? (params.tipo as ReportType)
    : "patrimonial";

  const audience: ReportAudience =
    params.publico === "cliente" && !INTERNAL_ONLY_TYPES.includes(type) ? "cliente" : "interno";

  const clientId = REPORT_TYPE_ALLOWS_CLIENT[type] ? (params.cliente || null) : null;

  return {
    type,
    title: defaultTitleFor(type, clientId ? clientName : null),
    audience,
    clientId,
    periodStart: REPORT_TYPE_ALLOWS_PERIOD[type] ? (params.inicio || null) : null,
    periodEnd: REPORT_TYPE_ALLOWS_PERIOD[type] ? (params.fim || null) : null,
    institution: REPORT_TYPE_ALLOWS_INSTITUTION[type] ? (params.instituicao || null) : null,
    sections: visibleSections(type, audience).map((s) => s.id),
  };
}

/** Monta o link de atalho usado pelos outros módulos. */
export function generatorHref(params: {
  tipo: ReportType;
  cliente?: string | null;
  inicio?: string | null;
  fim?: string | null;
  instituicao?: string | null;
  publico?: ReportAudience;
}): string {
  const search = new URLSearchParams({ tipo: params.tipo });
  if (params.cliente) search.set("cliente", params.cliente);
  if (params.inicio) search.set("inicio", params.inicio);
  if (params.fim) search.set("fim", params.fim);
  if (params.instituicao) search.set("instituicao", params.instituicao);
  if (params.publico) search.set("publico", params.publico);
  return `/relatorios/novo?${search.toString()}`;
}
