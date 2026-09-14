"use client";

import { Settings2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateContractBidRules } from "@/lib/actions/consortiums";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import { DEFAULT_MODALITY_OPTIONS, getBidRules, modalityLabel } from "@/lib/utils/bid-helpers";

export function BidRulesEditDialog({ contract }: { contract: ConsortiumContract }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rules = getBidRules(contract);
  const [modalities, setModalities] = useState<Set<string>>(
    new Set(rules.allowedModalities ?? DEFAULT_MODALITY_OPTIONS),
  );

  function toggleModality(m: string) {
    setModalities((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    function num(name: string): number | undefined {
      const raw = form.get(name);
      if (!raw) return undefined;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    function str(name: string): string | undefined {
      const raw = String(form.get(name) ?? "").trim();
      return raw || undefined;
    }

    await updateContractBidRules(contract.id, contract.clientId, {
      allowedModalities: Array.from(modalities),
      minPercentage: num("minPercentage"),
      maxPercentage: num("maxPercentage"),
      calculationBase: str("calculationBase"),
      tieBreakRule: str("tieBreakRule"),
      embeddedLimitPercentage: num("embeddedLimitPercentage"),
      offerDeadlineDays: num("offerDeadlineDays"),
      eligibilityRules: str("eligibilityRules"),
      postContemplationRules: str("postContemplationRules"),
      nextAssemblyDate: str("nextAssemblyDate"),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Settings2 className="h-3.5 w-3.5" />
        Regras do grupo
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Regras de lance — {contract.administratorName ?? "—"} · {contract.contractNumber ?? "—"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-card-beige-muted-foreground">
          Essas regras vêm do contrato/grupo específico — cada grupo pode ter regras diferentes. Deixe em
          branco o que não se aplica ou não for informado pela administradora.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">
              Modalidades permitidas
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_MODALITY_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleModality(m)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    modalities.has(m) ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground",
                  ].join(" ")}
                >
                  {modalityLabel(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input name="minPercentage" type="number" step="0.1" placeholder="% mínimo" defaultValue={rules.minPercentage ?? ""} />
            <Input name="maxPercentage" type="number" step="0.1" placeholder="% máximo" defaultValue={rules.maxPercentage ?? ""} />
          </div>

          <Input name="calculationBase" placeholder="Base de cálculo (ex: sobre o valor do crédito)" defaultValue={rules.calculationBase ?? ""} />
          <Input name="tieBreakRule" placeholder="Regra de desempate" defaultValue={rules.tieBreakRule ?? ""} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="embeddedLimitPercentage"
              type="number"
              step="0.1"
              placeholder="Limite do lance embutido (%)"
              defaultValue={rules.embeddedLimitPercentage ?? ""}
            />
            <Input
              name="offerDeadlineDays"
              type="number"
              placeholder="Prazo de oferta (dias antes)"
              defaultValue={rules.offerDeadlineDays ?? ""}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">
              Próxima assembleia
            </label>
            <Input name="nextAssemblyDate" type="date" defaultValue={rules.nextAssemblyDate ?? ""} />
          </div>

          <Textarea name="eligibilityRules" placeholder="Condições de elegibilidade" rows={2} defaultValue={rules.eligibilityRules ?? ""} />
          <Textarea
            name="postContemplationRules"
            placeholder="Regras pós-contemplação"
            rows={2}
            defaultValue={rules.postContemplationRules ?? ""}
          />

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar regras"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
