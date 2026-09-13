import { InfoField } from "@/components/consortiums/contract-shared";
import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function ContractContemplationTab({
  contract,
  bids,
}: {
  contract: ConsortiumContract;
  bids: ConsortiumBid[];
}) {
  const winningBid = bids.find((b) => b.result === "won");
  const isContemplated = Boolean(contract.contemplatedAt) || Boolean(winningBid) || contract.status === "contemplated";

  if (!isContemplated) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Essa cota ainda não foi contemplada. Quando houver um lance vencedor ou a data de contemplação
          for registrada, as informações aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Contemplação</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoField label="Data da contemplação" value={formatDate(contract.contemplatedAt)} />
          <InfoField
            label="Forma"
            value={winningBid ? (winningBid.bidType ?? "Lance") : "Não informado"}
          />
          <InfoField
            label="Valor do lance vencedor"
            value={winningBid?.bidAmount !== undefined ? formatCurrencyBRL(winningBid?.bidAmount ?? null) : null}
          />
        </div>
      </div>

      {winningBid ? (
        <div className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-3 text-h2 font-bold text-foreground">Lance vencedor</h3>
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
            <p className="font-semibold text-foreground">
              {winningBid.bidType ?? "Lance"}
              {winningBid.bidPercentage !== null ? ` · ${winningBid.bidPercentage}%` : ""}
            </p>
            <p className="mt-1 text-sm text-card-beige-muted-foreground">
              {winningBid.bidDate ? formatDate(winningBid.bidDate) : "Sem data"}
              {winningBid.notes ? ` · ${winningBid.notes}` : ""}
            </p>
          </div>
        </div>
      ) : null}

      <p className="text-body-sm text-card-beige-muted-foreground">
        Documentos da contemplação (carta de crédito, ata, comprovantes) podem ser enviados na aba{" "}
        <strong className="text-foreground">Documentos</strong>.
      </p>
    </div>
  );
}
