import type { Contemplation, RunHashes, RunOutput } from "./types.ts";

/**
 * Retificação e reprodução histórica.
 *
 * Nunca se sobrescreve um resultado: ORIGINAL → RETIFICAÇÃO → NOVO
 * RESULTADO. Aqui ficam as regras puras (validação do pedido e
 * comparação entre cálculos); a persistência atômica é
 * `consortium_record_run` no banco.
 */

export function validateRetificationRequest(input: {
  reason: string;
  requestedBy: string | null;
  approvedBy?: string | null;
  hasEvidence: boolean;
}): string[] {
  const errors: string[] = [];
  if (input.reason.trim().length < 10) errors.push("Motivo da retificação precisa de ao menos 10 caracteres.");
  if (!input.hasEvidence) errors.push("Retificação exige evidência (documento ou descrição da evidência).");
  if (input.approvedBy && input.requestedBy && input.approvedBy === input.requestedBy) {
    errors.push("Quem solicita a retificação não pode aprová-la (duas pessoas).");
  }
  return errors;
}

export type RunComparison = {
  identical: boolean;
  hashDiffs: (keyof RunHashes)[];
  added: number[];
  removed: number[];
  reordered: boolean;
};

/** Compara dois cálculos (original × reproduzido, ou original × retificado). */
export function compareRuns(
  original: { hashes: RunHashes; contemplations: Pick<Contemplation, "quotaNumber">[] },
  other: { hashes: RunHashes; contemplations: Pick<Contemplation, "quotaNumber">[] },
): RunComparison {
  const keys: (keyof RunHashes)[] = ["inputHash", "ruleHash", "eligibilityHash", "calculationHash", "resultHash"];
  const hashDiffs = keys.filter((k) => original.hashes[k] !== other.hashes[k]);
  const a = original.contemplations.map((c) => c.quotaNumber);
  const b = other.contemplations.map((c) => c.quotaNumber);
  const setA = new Set(a);
  const setB = new Set(b);
  const added = b.filter((q) => !setA.has(q));
  const removed = a.filter((q) => !setB.has(q));
  const reordered = added.length === 0 && removed.length === 0 && a.some((q, i) => b[i] !== q);
  return { identical: hashDiffs.length === 0, hashDiffs, added, removed, reordered };
}

/** Atalho: reproduz e diz se bate com o que foi registrado. */
export function verifyReproduction(stored: { hashes: RunHashes; contemplations: Pick<Contemplation, "quotaNumber">[] }, reproduced: RunOutput) {
  return compareRuns(stored, reproduced);
}
