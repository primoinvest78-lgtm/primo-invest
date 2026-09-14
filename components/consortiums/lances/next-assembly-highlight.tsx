import Link from "next/link";

import type { ConsortiumContract } from "@/lib/data/consortiums";
import { allowedModalitiesFor, daysFromNow, getBidRules, modalityLabel, subtractDays } from "@/lib/utils/bid-helpers";
import { formatDate } from "@/lib/utils/format";

export function NextAssemblyHighlight({ contracts }: { contracts: ConsortiumContract[] }) {
  const withAssembly = contracts
    .map((c) => ({ contract: c, rules: getBidRules(c) }))
    .filter((x) => Boolean(x.rules.nextAssemblyDate))
    .sort((a, b) => (a.rules.nextAssemblyDate as string).localeCompare(b.rules.nextAssemblyDate as string));

  const next = withAssembly[0];

  if (!next) {
    return (
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <p className="text-label font-bold uppercase text-primary">Próxima assembleia</p>
        <p className="mt-2 text-sm text-card-beige-muted-foreground">
          Informação indisponível — nenhum contrato tem data de próxima assembleia cadastrada nas regras
          do grupo.
        </p>
      </div>
    );
  }

  const { contract, rules } = next;
  const days = daysFromNow(rules.nextAssemblyDate as string);
  const deadlineDate =
    rules.offerDeadlineDays !== undefined
      ? subtractDays(rules.nextAssemblyDate as string, rules.offerDeadlineDays)
      : null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <p className="text-label font-bold uppercase text-primary">Próxima assembleia</p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-foreground">{formatDate(rules.nextAssemblyDate)}</p>
          <p className="mt-1 text-sm text-card-beige-muted-foreground">
            Grupo {contract.groupNumber ?? "não informado"} · Cota {contract.quotaNumber ?? "não informado"} ·{" "}
            {contract.administratorName ?? "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {days >= 0 ? `em ${days} ${days === 1 ? "dia" : "dias"}` : "data já passou"}
          </p>
          <p className="text-xs font-medium text-card-beige-muted-foreground">
            Prazo pra ofertar: {deadlineDate ? formatDate(deadlineDate.toISOString()) : "não informado"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/10 pt-3">
        <span className="text-xs font-bold uppercase text-card-beige-muted-foreground">Modalidades:</span>
        {allowedModalitiesFor(contract).map((m) => (
          <span key={m} className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground">
            {modalityLabel(m)}
          </span>
        ))}
      </div>

      <Link
        href={`/consorcios/contratos/${contract.id}`}
        className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
      >
        Abrir contrato →
      </Link>
    </div>
  );
}
