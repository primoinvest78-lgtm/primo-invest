"use client";

import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addBid } from "@/lib/actions/consortiums";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import {
  allowedModalitiesFor,
  checkEligibility,
  getBidRules,
  modalityLabel,
  protocolFor,
  runBidSimulation,
} from "@/lib/utils/bid-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

type Step = "contract" | "offer" | "review" | "done";

export function BidOfferDialog({ contracts }: { contracts: ConsortiumContract[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("contract");
  const [loading, setLoading] = useState(false);
  const [contractId, setContractId] = useState("");
  const [modality, setModality] = useState("livre");
  const [percentage, setPercentage] = useState("");
  const [bidDate, setBidDate] = useState(new Date().toISOString().slice(0, 10));
  const [protocol, setProtocol] = useState<string | null>(null);

  const contract = contracts.find((c) => c.id === contractId);
  const eligibility = contract ? checkEligibility(contract) : null;
  const rules = contract ? getBidRules(contract) : {};
  const modalities = useMemo(() => (contract ? allowedModalitiesFor(contract) : []), [contract]);

  const simulation = useMemo(() => {
    if (!contract || !percentage) return null;
    return runBidSimulation({
      contract,
      modality,
      percentage: Number(percentage),
      amount: null,
      ownResources: 0,
      embeddedAmount: 0,
    });
  }, [contract, modality, percentage]);

  function reset() {
    setStep("contract");
    setContractId("");
    setModality("livre");
    setPercentage("");
    setBidDate(new Date().toISOString().slice(0, 10));
    setProtocol(null);
  }

  async function handleConfirm() {
    if (!contract || !simulation) return;
    setLoading(true);

    const created = await addBid(contract.id, contract.clientId, {
      bidType: modality,
      bidAmount: simulation.bidValue,
      bidPercentage: simulation.bidPercentage,
      bidDate,
      result: "pending",
      notes: "",
    });

    setProtocol(protocolFor({ id: created.id }));
    setLoading(false);
    setStep("done");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-3.5 w-3.5" />
        Ofertar lance
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ofertar lance</DialogTitle>
        </DialogHeader>

        {step === "contract" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Contrato</label>
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

            {contract ? (
              eligibility && !eligibility.eligible ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{eligibility.reason}</span>
                </div>
              ) : (
                <div className="space-y-2 rounded-xl border border-black/10 bg-black/5 p-4">
                  <p className="text-xs font-bold uppercase text-card-beige-muted-foreground">Regras do grupo</p>
                  <p className="text-sm text-foreground">
                    % mín/máx: {rules.minPercentage ?? "não informado"} / {rules.maxPercentage ?? "não informado"}
                  </p>
                  <p className="text-sm text-foreground">
                    Limite de embutido: {rules.embeddedLimitPercentage !== undefined ? `${rules.embeddedLimitPercentage}%` : "não informado"}
                  </p>
                  <p className="text-sm text-foreground">
                    Elegibilidade: {rules.eligibilityRules ?? "não informado"}
                  </p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    Regras dependem do grupo/contrato — sempre confirme com a administradora quando não
                    informado aqui.
                  </p>
                </div>
              )
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                disabled={!contract || (eligibility ? !eligibility.eligible : true)}
                onClick={() => setStep("offer")}
              >
                Continuar
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "offer" && contract ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                Modalidade
                <InfoTooltip>
                  Livre: percentual definido por você, sem limite de embutido. Fixo: percentual travado
                  pela administradora. Embutido: usa parte do crédito para pagar o próprio lance. Misto:
                  combina recurso próprio com embutido. As opções disponíveis dependem das regras do grupo.
                </InfoTooltip>
              </label>
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

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                Percentual do lance
                <InfoTooltip>
                  Percentual sobre o valor do crédito que você está dispondo a antecipar/ofertar na
                  assembleia. Quanto maior, mais chance de contemplação — mas confira o mínimo e máximo
                  permitidos nas regras do grupo acima.
                </InfoTooltip>
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex.: 25"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
            <Input type="date" value={bidDate} onChange={(e) => setBidDate(e.target.value)} />

            {simulation ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="text-xs font-bold uppercase text-primary">Simulação</p>
                <p className="mt-1 font-semibold text-foreground">{formatCurrencyBRL(simulation.bidValue)}</p>
                <p className="text-xs text-card-beige-muted-foreground">Não é garantia de contemplação.</p>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("contract")}>
                Voltar
              </Button>
              <Button type="button" disabled={!percentage} onClick={() => setStep("review")}>
                Revisar
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "review" && contract && simulation ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-xl border border-black/10 bg-black/5 p-4 text-sm">
              <p>
                <strong>Contrato:</strong> {contract.administratorName} · {contract.contractNumber}
              </p>
              <p>
                <strong>Grupo/Cota:</strong> {contract.groupNumber ?? "não informado"} /{" "}
                {contract.quotaNumber ?? "não informado"}
              </p>
              <p>
                <strong>Modalidade:</strong> {modalityLabel(modality)}
              </p>
              <p>
                <strong>Percentual:</strong> {percentage}%
              </p>
              <p>
                <strong>Valor:</strong> {formatCurrencyBRL(simulation.bidValue)}
              </p>
              <p>
                <strong>Data:</strong> {formatDate(bidDate)}
              </p>
            </div>
            <p className="text-xs font-medium text-card-beige-muted-foreground">
              Confirmar registra este lance no histórico do contrato. Isso não garante contemplação — o
              resultado depende da assembleia e das regras do grupo.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("offer")} disabled={loading}>
                Voltar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={loading}>
                {loading ? "Registrando..." : "Confirmar oferta"}
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "done" && protocol ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="text-lg font-bold text-foreground">Lance registrado</p>
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="text-xs font-bold uppercase text-card-beige-muted-foreground">Protocolo</p>
              <p className="text-xl font-bold text-foreground">{protocol}</p>
            </div>
            <p className="text-xs text-card-beige-muted-foreground">
              O lance está com status &ldquo;Ofertado&rdquo; e vai aparecer no histórico. Atualize o resultado
              quando a assembleia acontecer.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
