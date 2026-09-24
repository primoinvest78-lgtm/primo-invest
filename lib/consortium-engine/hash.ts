import { createHash } from "node:crypto";

/**
 * JSON canônico: chaves ordenadas recursivamente, sem espaços. Dois
 * objetos com o mesmo conteúdo sempre produzem a mesma string — e o
 * mesmo hash — independentemente da ordem em que as chaves foram
 * montadas (banco, formulário, jsonb do Postgres).
 */
export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Número não finito não pode ser serializado de forma canônica.");
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  throw new Error(`Tipo não serializável: ${typeof value}`);
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hashOf(value: unknown): string {
  return sha256(canonicalJson(value));
}
