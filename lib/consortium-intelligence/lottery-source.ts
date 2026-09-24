import type { LotteryResult } from "../consortium-engine/types.ts";

/**
 * Coleta automática do resultado OFICIAL (API pública da CAIXA).
 *
 * Nunca confia só na URL: o conteúdo bruto é guardado como evidência,
 * a normalização é registrada por escrito e o resultado entra como
 * PENDENTE — alguém com papel de governança ainda confere e verifica.
 *
 * Normalização conhecida: a API publica cada bilhete com 6 posições
 * ("040292"), enquanto os regulamentos usam 5 algarismos por prêmio. O
 * zero à esquerda só é removido se for de fato zero; qualquer outro
 * formato reprova a coleta.
 */

export const FEDERAL_API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api/federal";

export type NormalizedFetch = {
  result: LotteryResult | null;
  notes: string[];
  errors: string[];
};

function brDateToIso(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function normalizeFederalPayload(payload: unknown, prizeDigits: number): NormalizedFetch {
  const notes: string[] = [];
  const errors: string[] = [];
  const p = payload as Record<string, unknown> | null;
  if (!p || typeof p !== "object") return { result: null, notes, errors: ["Resposta da fonte vazia ou inválida."] };
  if (p.tipoJogo && p.tipoJogo !== "LOTERIA_FEDERAL") errors.push(`Resposta não é da Loteria Federal (${String(p.tipoJogo)}).`);
  const contest = p.numero;
  if (typeof contest !== "number" && typeof contest !== "string") errors.push("Número do concurso ausente na resposta.");
  const drawDate = brDateToIso(p.dataApuracao);
  if (!drawDate) errors.push("Data de apuração ausente ou em formato inesperado.");
  const list = (Array.isArray(p.listaDezenas) ? p.listaDezenas : Array.isArray(p.dezenasSorteadasOrdemSorteio) ? p.dezenasSorteadasOrdemSorteio : null) as unknown[] | null;
  if (!list || list.length === 0) errors.push("Lista de prêmios ausente na resposta.");

  const prizes: string[] = [];
  for (const [i, raw] of (list ?? []).entries()) {
    const s = String(raw).trim();
    if (!/^\d+$/.test(s)) {
      errors.push(`${i + 1}º prêmio com caracteres inválidos: "${s}".`);
      continue;
    }
    if (s.length === prizeDigits) prizes.push(s);
    else if (s.length > prizeDigits && /^0+$/.test(s.slice(0, s.length - prizeDigits))) {
      prizes.push(s.slice(s.length - prizeDigits));
      notes.push(`${i + 1}º prêmio publicado como "${s}" (${s.length} posições); zero(s) à esquerda removido(s) → "${s.slice(s.length - prizeDigits)}".`);
    } else {
      errors.push(`${i + 1}º prêmio "${s}" não cabe em ${prizeDigits} algarismos sem perder dígito significativo.`);
    }
  }
  if (errors.length) return { result: null, notes, errors };
  return {
    result: { source: "FEDERAL_LOTTERY", contestNumber: String(contest), drawDate: drawDate!, prizes },
    notes,
    errors,
  };
}

/** Busca na fonte oficial com timeout. Nunca lança: devolve erro legível. */
export async function fetchFederalResult(contest?: string, timeoutMs = 12_000): Promise<{ payload: unknown | null; url: string; error: string | null }> {
  const url = contest ? `${FEDERAL_API_BASE}/${encodeURIComponent(contest)}` : FEDERAL_API_BASE;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (PRIMO INVEST - conferencia de resultado oficial)" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return { payload: null, url, error: `Fonte oficial respondeu HTTP ${res.status}.` };
    return { payload: await res.json(), url, error: null };
  } catch (e) {
    const msg = e instanceof Error ? (e.name === "AbortError" ? "tempo esgotado" : e.message) : String(e);
    return { payload: null, url, error: `Não foi possível consultar a fonte oficial (${msg}).` };
  } finally {
    clearTimeout(timer);
  }
}
