"use client";

import { AlertTriangle, Calculator } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BidRulesEditDialog } from "@/components/consortiums/lances/bid-rules-edit-dialog";
import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import {
  allowedModalitiesFor,
  compareBidToAverage,
  computeGroupBidStats,
  getBidRules,
  modalityLabel,
  runBidSimulation,
} from "@/lib/utils/bid-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

const COMPARISON_TEXT: Record<string, string> = {
  above: "Historicamente, esta oferta está acima da média de lances vencedores observada neste contrato.",
  near: "Historicamente, esta oferta está próxima da média de lances vencedores observada neste contrato.",
  below: "Historicamente, esta oferta está abaixo da média de lances vencedores observada neste contrato.",
};

export function BidSimulator({
  contracts,
  bids,
}: {
  contracts: ConsortiumContract[];
  bids: ConsortiumBid[];
}) {
  const [contractId, setContractId] = useState(contracts[0]?.id ?? "");
  const [modality, setModality] = useState("livre");
  const [valueMode, setValueMode] = useState<"percentage" | "amount">("percentage");
  const [percentage, setPercentage] = useState("10");
  const [amount, setAmount] = useState("");
  const [ownResources, setOwnResources] = useState("");
  const [embeddedAmount, setEmbeddedAmount] = useState("");
  const [objective, setObjective] = useState("");

  const contract = contracts.find((c) => c.id === contractId);
  const modalities = useMemo(() => (contract ? allowedModalitiesFor(contract) : []), [contract]);
  const isEmbeddedModality = modality === "embutido" || modality === "misto";

  const result = useMemo(() => {
    if (!contract) return null;
    return runBidSimulation({
      contract,
      modality,
      percentage: valueMode === "percentage" && percentage ? Number(percentage) : null,
      amount: valueMode === "amount" && amount ? Number(amount) : null,
      ownResources: Number(ownResources || 0),
      embeddedAmount: isEmbeddedModality ? Number(embeddedAmount || 0) : 0,
    });
  }, [contract, modality, valueMode, percentage, amount, ownResources, embeddedAmount, isEmbeddedModality]);

  const groupStats = useMemo(() => {
    if (!contract) return null;
    return computeGroupBidStats(bids.filter((b) => b.contractId === contract.id));
  }, [contract, bids]);

  const comparison =
    result?.bidPercentage !== null && result?.bidPercentage !== undefined && groupStats?.avgWonPercentage !== null && groupStats?.avgWonPercentage !== undefined
      ? compareBidToAverage(result.bidPercentage, groupStats.avgWonPercentage)
      : null;

  return (
    <div className="block-navy-3d rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-h2 font-bold text-secondary-foreground">Simulador de lance</h3>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ENTRADA */}
        <div className="space-y-3 rounded-xl bg-white/5 p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-secondary-foreground/60">Contrato</label>
              {contract ? <BidRulesEditDialog contract={contract} /> : null}
            </div>
            <Select value={contractId} onValueChange={(v) => setContractId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o contrato" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.administratorName ?? "—"} · {c.contractNumber ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-secondary-foreground/60">Modalidade</label>
            <Select value={modality} onValueChange={(v) => setModality(v ?? "livre")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                {modalities.map((m) => (
                  <SelectItem key={m} value={m}>
                    {modalityLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValueMode("percentage")}
              className={[
                "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                valueMode === "percentage" ? "border-primary bg-primary/20 text-secondary-foreground" : "border-white/20 text-secondary-foreground/60",
              ].join(" ")}
            >
              % do crédito
            </button>
            <button
              type="button"
              onClick={() => setValueMode("amount")}
              className={[
                "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                valueMode === "amount" ? "border-primary bg-primary/20 text-secondary-foreground" : "border-white/20 text-secondary-foreground/60",
              ].join(" ")}
            >
              Valor (R$)
            </button>
          </div>

          {valueMode === "percentage" ? (
            <Input
              type="number"
              step="0.1"
              placeholder="Percentual do lance"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="bg-white text-foreground"
            />
          ) : (
            <Input
              type="number"
              step="0.01"
              placeholder="Valor do lance"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white text-foreground"
            />
          )}

          <Input
            type="number"
            step="0.01"
            placeholder="Recursos próprios disponíveis"
            value={ownResources}
            onChange={(e) => setOwnResources(e.target.value)}
            className="bg-white text-foreground"
          />

          {isEmbeddedModality ? (
            <Input
              type="number"
              step="0.01"
              placeholder="Valor embutido (deduzido do crédito)"
              value={embeddedAmount}
              onChange={(e) => setEmbeddedAmount(e.target.value)}
              className="bg-white text-foreground"
            />
          ) : null}

          <Input
            placeholder="Objetivo da antecipação (opcional)"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="bg-white text-foreground"
          />
        </div>

        {/* RESULTADO */}
        <div className="space-y-3">
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs font-bold uppercase text-warning">
            Simulação — não é garantia de contemplação
          </div>

          {result && contract ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground/60">Valor do lance</p>
                  <p className="mt-1 text-lg font-bold text-secondary-foreground">{formatCurrencyBRL(result.bidValue)}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground/60">Percentual</p>
                  <p className="mt-1 text-lg font-bold text-secondary-foreground">
                    {result.bidPercentage !== null ? `${result.bidPercentage.toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground/60">Crédito antes</p>
                  <p className="mt-1 text-sm font-semibold text-secondary-foreground">{formatCurrencyBRL(result.creditBefore)}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground/60">
                    Crédito após embutido
                  </p>
                  <p className="mt-1 text-sm font-semibold text-secondary-foreground">
                    {formatCurrencyBRL(result.creditAfterEmbedded)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground/60">Impacto no saldo</p>
                  <p className="mt-1 text-sm font-semibold text-secondary-foreground">
                    {formatCurrencyBRL(result.balanceImpact)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground/60">
                    Parcelas antecipadas (est.)
                  </p>
                  <p className="mt-1 text-sm font-semibold text-secondary-foreground">
                    {result.estimatedAnticipatedInstallments !== null
                      ? result.estimatedAnticipatedInstallments.toFixed(1)
                      : "—"}
                  </p>
                </div>
              </div>

              {result.embeddedExceedsLimit ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    O valor embutido informado excede o limite definido nas regras do grupo (
                    {getBidRules(contract).embeddedLimitPercentage}% do crédito).
                  </span>
                </div>
              ) : null}

              {comparison ? (
                <p className="text-xs text-secondary-foreground/70">{COMPARISON_TEXT[comparison]}</p>
              ) : (
                <p className="text-xs text-secondary-foreground/50">
                  Histórico insuficiente para análise comparativa neste contrato.
                </p>
              )}

              <p className="text-[11px] text-secondary-foreground/50">
                Impacto no plano: {objective ? `objetivo informado — "${objective}". ` : ""}
                Resultados históricos não garantem resultado futuro; as regras dependem do grupo/contrato.
              </p>
            </>
          ) : (
            <p className="text-sm text-secondary-foreground/60">Selecione um contrato pra simular.</p>
          )}
        </div>
      </div>
    </div>
  );
}
