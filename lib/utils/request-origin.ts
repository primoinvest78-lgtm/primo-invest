import { headers } from "next/headers";

/**
 * Origem (protocolo + host) da requisição atual — usado só pra montar
 * URLs absolutas que saem da plataforma (ex.: o link do feed de
 * calendário que o usuário cola no Google Calendar). Lido do próprio
 * request, não de uma env var fixa, então funciona igual em
 * desenvolvimento e produção sem configuração extra.
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
