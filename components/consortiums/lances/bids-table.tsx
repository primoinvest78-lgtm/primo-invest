"use client";

import { ChevronDown, FileText, ListTodo, User } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import {
  bidResultLabel,
  BID_RESULT_VARIANT,
  compareBidToAverage,
  computeGroupBidStats,
  getBidRules,
  modalityLabel,
  protocolFor,
} from "@/lib/utils/bid-helpers";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";

const COMPARISON_TEXT: Record<string, string> = {
  above: "Historicamente, esse lance ficou acima da média de lances vencedores observada neste contrato.",
  near: "Historicamente, esse lance ficou próximo da média de lances vencedores observada neste contrato.",
  below: "Historicamente, esse lance ficou abaixo da média de lances vencedores observada neste contrato.",
};

const POST_CONTEMPLATION_STEPS = [
  "Confirmação do resultado com a administradora",
  "Pagamento do lance (quando aplicável)",
  "Envio de documentação",
  "Análise da administradora",
  "Liberação do crédito",
  "Utilização do crédito",
];

function BidRowDetail({
  bid,
  contract,
  allBids,
}: {
  bid: ConsortiumBid;
  contract: ConsortiumContract | undefined;
  allBids: ConsortiumBid[];
}) {
  const stats = computeGroupBidStats(allBids.filter((b) => b.contractId === bid.contractId));
  const comparison =
    bid.bidPercentage !== null && stats.avgWonPercentage !== null
      ? compareBidToAverage(Number(bid.bidPercentage), stats.avgWonPercentage)
      : null;

  return (
    <tr className="bg-black/[0.03]">
      <td colSpan={9} className="px-4 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Protocolo</p>
              <p className="text-sm font-semibold text-foreground">{protocolFor(bid)}</p>
              <p className="text-xs text-card-beige-muted-foreground">
                Registrado em {formatDateTime(bid.createdAt)}
                {bid.createdByName ? ` por ${bid.createdByName}` : ""}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Análise do lance</p>
              <p className="text-sm text-foreground">
                {comparison ? COMPARISON_TEXT[comparison] : "Histórico insuficiente para análise."}
              </p>
            </div>

            {bid.result === "won" ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                  Próximos passos (pós-contemplação)
                </p>
                <ul className="space-y-1 text-xs text-card-beige-muted-foreground">
                  {POST_CONTEMPLATION_STEPS.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ul>
                {contract ? (
                  <p className="mt-1 text-[11px] text-card-beige-muted-foreground/80">
                    {getBidRules(contract).postContemplationRules ?? "Regras pós-contemplação não informadas pelo grupo."}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <NewTaskDialog consortiumContractId={bid.contractId} clientId={bid.clientId ?? undefined} />
            <Link
              href={`/consorcios/contratos/${bid.contractId}`}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <FileText className="h-3.5 w-3.5" />
              Abrir contrato
            </Link>
            {bid.clientId ? (
              <Link
                href={`/clientes/${bid.clientId}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <User className="h-3.5 w-3.5" />
                Abrir cliente
              </Link>
            ) : null}
            <Link
              href={`/consorcios/contratos/${bid.contractId}`}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <ListTodo className="h-3.5 w-3.5" />
              Ver documentos
            </Link>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function BidsTable({
  bids,
  contracts,
}: {
  bids: ConsortiumBid[];
  contracts: ConsortiumContract[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const contractsById = useMemo(() => new Map(contracts.map((c) => [c.id, c])), [contracts]);

  return (
    <div className="card-premium overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-black/5 text-left">
            <th className="w-8 px-2 py-3" />
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Contrato</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Grupo/Cota</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Assembleia</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Modalidade</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">%</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Valor</th>
            <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Resultado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {bids.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                Nenhum lance encontrado.
              </td>
            </tr>
          ) : (
            bids.map((bid) => {
              const isExpanded = expandedId === bid.id;
              return (
                <Fragment key={bid.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : bid.id)}
                    className="group cursor-pointer border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                  >
                    <td className="px-2 py-3">
                      <ChevronDown
                        className={["h-3.5 w-3.5 text-card-beige-muted-foreground transition-transform", isExpanded ? "rotate-180" : ""].join(" ")}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{bid.contractLabel}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {bid.contractGroupNumber ?? "—"} / {bid.contractQuotaNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(bid.bidDate)}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {bid.bidType ? modalityLabel(bid.bidType) : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {bid.bidPercentage !== null ? `${bid.bidPercentage}%` : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyBRL(bid.bidAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={BID_RESULT_VARIANT[bid.result] ?? "outline"}>{bidResultLabel(bid.result)}</Badge>
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                  {isExpanded ? (
                    <BidRowDetail bid={bid} contract={contractsById.get(bid.contractId)} allBids={bids} />
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
