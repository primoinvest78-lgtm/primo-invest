import type { ApproximationMethod, FallbackMethod, GroupNumbering } from "./types.ts";

/**
 * Sequências de aproximação e fallback — geradores determinísticos de
 * "próximo número a testar" a partir de uma base. Nenhum método é
 * inventado aqui: o motor só usa o que a regra autoriza.
 *
 * Retornam números SEM a base (a base já foi testada por quem chama).
 */

function step(value: number, delta: number, numbering: GroupNumbering, wrap: boolean): number | null {
  const next = value + delta;
  if (next > numbering.numberEnd) return wrap ? numbering.numberStart : null;
  if (next < numbering.numberStart) return wrap ? numbering.numberEnd : null;
  return next;
}

/**
 * Até `limit` números seguindo o método. ALTERNATING_UP_FIRST a partir
 * de 60: 61, 59, 62, 58, 63, 57… (padrão "crescente e decrescente,
 * alternada e sucessivamente" de regulamentos reais).
 */
export function neighborSequence(
  base: number,
  method: ApproximationMethod | Exclude<FallbackMethod, "PREDEFINED_SEQUENCE">,
  numbering: GroupNumbering,
  wrapAround: boolean,
  limit: number,
): number[] {
  const out: number[] = [];
  const size = numbering.numberEnd - numbering.numberStart + 1;
  const cap = Math.min(limit, size - 1);
  if (method === "NONE" || cap <= 0) return out;

  if (method === "NEXT_HIGHER" || method === "NEXT_LOWER") {
    const delta = method === "NEXT_HIGHER" ? 1 : -1;
    let current: number | null = base;
    while (out.length < cap) {
      current = step(current, delta, numbering, wrapAround);
      if (current === null || current === base) break;
      out.push(current);
    }
    return out;
  }

  // Alternado: distância 1, 2, 3… pra cima e pra baixo.
  const upFirst = method === "ALTERNATING_UP_FIRST";
  const seen = new Set<number>([base]);
  for (let d = 1; out.length < cap && d <= size; d += 1) {
    const candidates = upFirst ? [base + d, base - d] : [base - d, base + d];
    for (let c of candidates) {
      if (c > numbering.numberEnd || c < numbering.numberStart) {
        if (!wrapAround) continue;
        c = ((((c - numbering.numberStart) % size) + size) % size) + numbering.numberStart;
      }
      if (seen.has(c)) continue;
      seen.add(c);
      out.push(c);
      if (out.length >= cap) break;
    }
  }
  return out;
}

export function fallbackSequence(
  base: number,
  fallback: { method: FallbackMethod; wrapAround: boolean; sequence?: number[] },
  numbering: GroupNumbering,
): number[] {
  if (fallback.method === "PREDEFINED_SEQUENCE") return [...(fallback.sequence ?? [])];
  const size = numbering.numberEnd - numbering.numberStart + 1;
  return [base, ...neighborSequence(base, fallback.method, numbering, fallback.wrapAround, size)];
}
