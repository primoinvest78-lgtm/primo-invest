import { formatBRL as brl } from "./trace.ts";
import type { ResourceAssessment, ResourceInput, RuleConfig } from "./types.ts";

/**
 * Resource Engine — NÃO assume "1 assembleia = 1 contemplação". A
 * quantidade de contemplações por sorteio sai do fundo disponível ÷
 * valor do crédito, limitada ao previsto; o que sobra vai pros lances.
 */

export function assessResources(input: ResourceInput, rules: RuleConfig["resources"]): ResourceAssessment {
  const justification: string[] = [];
  const blocked = (reason: string): ResourceAssessment => ({
    status: "BLOCKED",
    available: 0,
    creditAmount: input.creditAmount ?? 0,
    capacity: 0,
    drawSlots: 0,
    remainingAfterDraw: 0,
    justification: [...justification, reason],
  });

  if (input.groupStatus === "SUSPENDED" || input.groupStatus === "CLOSED") {
    return blocked(`Grupo ${input.groupStatus === "SUSPENDED" ? "suspenso" : "encerrado"} — contemplações bloqueadas.`);
  }
  if (input.commonFundBalance === null) return blocked("Saldo do fundo comum não informado.");
  if (input.creditAmount === null || input.creditAmount <= 0) return blocked("Valor do crédito não informado.");

  let available = input.commonFundBalance;
  justification.push(`Fundo comum: ${brl(input.commonFundBalance)}.`);
  if (input.reserveFundUsable) {
    if (!rules.reserveFundAllowed) {
      justification.push("Uso do fundo de reserva solicitado, mas a regra não autoriza — ignorado.");
    } else if (input.reserveFundBalance !== null) {
      available += input.reserveFundBalance;
      justification.push(`Fundo de reserva autorizado pela regra: ${brl(input.reserveFundBalance)}.`);
    }
  }

  const capacity = Math.floor(available / input.creditAmount);
  const drawSlots = Math.min(capacity, input.plannedDrawContemplations);
  const remainingAfterDraw = available - drawSlots * input.creditAmount;
  justification.push(
    `Disponível ${brl(available)} ÷ crédito ${brl(input.creditAmount)} = ${capacity} contemplação(ões) possível(is); previstas ${input.plannedDrawContemplations} por sorteio.`,
  );

  let status: ResourceAssessment["status"];
  if (capacity === 0) {
    status = "INSUFFICIENT";
    justification.push("Recursos insuficientes para qualquer contemplação.");
  } else if (drawSlots < input.plannedDrawContemplations) {
    status = "PARTIAL";
    justification.push(`Só ${drawSlots} de ${input.plannedDrawContemplations} contemplação(ões) previstas cabem nos recursos.`);
  } else {
    status = "AVAILABLE";
  }

  return { status, available, creditAmount: input.creditAmount, capacity, drawSlots, remainingAfterDraw, justification };
}
