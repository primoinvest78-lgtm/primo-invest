/**
 * Sorteio próprio auditável (roleta) — CONFERÊNCIA.
 *
 * Quem sorteia é o banco (consortium_own_draw_commit / _reveal): ele
 * gera um segredo aleatório, publica só o sha256 dele ANTES da
 * assembleia (selo prévio) e, no sorteio, deriva os números de
 *   sha256(segredo | frase pública e horário | nº do prêmio | tentativa).
 * Este arquivo refaz a mesma conta, byte a byte, para que qualquer
 * pessoa confira que (1) o segredo revelado é o que foi selado e
 * (2) os números saíram dele — sem ninguém ter escolhido nada.
 *
 * Usa a Web Crypto (globalThis.crypto.subtle), que existe no navegador
 * e no Node — por isso pode rodar na tela, no computador de quem confere.
 * Sem relógio, sem Math.random: mesma entrada, mesma saída.
 */

export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Espelho de consortium_own_draw_derive (SQL): os 15 primeiros dígitos
 * hexadecimais do hash (60 bits) módulo 10^algarismos, com zeros à
 * esquerda. Número repetido → nova tentativa com o contador seguinte.
 */
export async function deriveOwnDrawNumbers(seedHex: string, entropy: string, count: number, digits: number): Promise<string[]> {
  const mod = BigInt(10) ** BigInt(digits);
  const out: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    for (let attempt = 0; ; attempt += 1) {
      const hash = await sha256Hex(`${seedHex}|${entropy}|${i}|${attempt}`);
      const value = (BigInt(`0x${hash.slice(0, 15)}`) % mod).toString().padStart(digits, "0");
      if (!out.includes(value)) {
        out.push(value);
        break;
      }
    }
  }
  return out;
}

export type OwnDrawRecord = {
  commitmentHash: string;
  revealedSeed: string | null;
  publicEntropy: string | null;
  prizes: string[] | null;
  prizeDigits: number | null;
};

export type OwnDrawCheck = { label: string; ok: boolean; detail: string };
export type OwnDrawVerification = { ok: boolean; checks: OwnDrawCheck[]; recomputed: string[] };

export async function verifyOwnDraw(record: OwnDrawRecord): Promise<OwnDrawVerification> {
  if (!record.revealedSeed || !record.publicEntropy || !record.prizes || !record.prizeDigits) {
    return {
      ok: false,
      recomputed: [],
      checks: [{ label: "Sorteio realizado", ok: false, detail: "O sorteio ainda não foi feito; só o selo prévio existe." }],
    };
  }
  const sealed = (await sha256Hex(record.revealedSeed)) === record.commitmentHash;
  const recomputed = await deriveOwnDrawNumbers(record.revealedSeed, record.publicEntropy, record.prizes.length, record.prizeDigits);
  const same = recomputed.length === record.prizes.length && recomputed.every((n, i) => n === record.prizes![i]);
  return {
    ok: sealed && same,
    recomputed,
    checks: [
      {
        label: "Selo prévio",
        ok: sealed,
        detail: sealed
          ? "O segredo revelado é exatamente o que foi selado antes da assembleia."
          : "O segredo revelado NÃO corresponde ao selo prévio.",
      },
      {
        label: "Números sorteados",
        ok: same,
        detail: same
          ? `Recalculados a partir do segredo e da frase pública: ${recomputed.join(", ")}.`
          : `O recálculo deu ${recomputed.join(", ")}, diferente do registrado.`,
      },
    ],
  };
}
