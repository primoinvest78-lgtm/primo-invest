"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addBid, deleteBid, updateBid } from "@/lib/actions/consortiums";
import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import {
  allowedModalitiesFor,
  BID_RESULT_OPTIONS,
  BID_RESULT_VARIANT,
  bidResultLabel,
  modalityLabel,
  protocolFor,
} from "@/lib/utils/bid-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function BidFormDialog({
  contract,
  bid,
  triggerRender,
  triggerChildren,
  triggerClassName,
}: {
  contract: ConsortiumContract;
  bid?: ConsortiumBid;
  triggerRender: React.ReactElement;
  triggerChildren: React.ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(bid?.result ?? "pending");
  const [bidType, setBidType] = useState(bid?.bidType ?? allowedModalitiesFor(contract)[0]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const bidAmount = form.get("bidAmount");
    const bidPercentage = form.get("bidPercentage");

    const input = {
      bidType,
      bidAmount: bidAmount ? Number(bidAmount) : null,
      bidPercentage: bidPercentage ? Number(bidPercentage) : null,
      bidDate: String(form.get("bidDate") ?? "") || null,
      result,
      notes: String(form.get("notes") ?? ""),
    };

    if (bid) {
      await updateBid(bid.id, contract.id, contract.clientId, input);
    } else {
      await addBid(contract.id, contract.clientId, input);
    }

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender} className={triggerClassName}>
        {triggerChildren}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bid ? "Editar lance" : "Registrar lance"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={bidType} onValueChange={(v) => setBidType(v ?? bidType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              {allowedModalitiesFor(contract).map((m) => (
                <SelectItem key={m} value={m}>
                  {modalityLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input name="bidAmount" type="number" step="0.01" placeholder="Valor do lance" defaultValue={bid?.bidAmount ?? ""} />
            <Input name="bidPercentage" type="number" step="0.01" placeholder="% do crédito" defaultValue={bid?.bidPercentage ?? ""} />
          </div>
          <Input name="bidDate" type="date" defaultValue={bid?.bidDate ?? ""} />
          <Select value={result} onValueChange={(v) => setResult(v ?? "pending")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              {BID_RESULT_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {bidResultLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea name="notes" placeholder="Observações" rows={2} defaultValue={bid?.notes ?? ""} />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ContractBidsTab({
  contract,
  bids,
}: {
  contract: ConsortiumContract;
  bids: ConsortiumBid[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <BidFormDialog
          contract={contract}
          triggerRender={<Button size="sm" variant="outline" />}
          triggerChildren={
            <>
              <Plus className="h-3.5 w-3.5" />
              Registrar lance
            </>
          }
        />
      </div>

      {bids.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhum lance registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="card-premium flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {bid.bidType ? modalityLabel(bid.bidType) : "Lance"}
                  {bid.bidPercentage !== null ? ` · ${bid.bidPercentage}%` : ""}
                </p>
                <p className="text-xs text-card-beige-muted-foreground">
                  {bid.bidDate ? formatDate(bid.bidDate) : "Sem data"} · {protocolFor(bid)}
                  {bid.notes ? ` · ${bid.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {bid.bidAmount !== null ? (
                  <span className="font-semibold text-foreground">{formatCurrencyBRL(bid.bidAmount)}</span>
                ) : null}
                <Badge variant={BID_RESULT_VARIANT[bid.result] ?? "outline"}>{bidResultLabel(bid.result)}</Badge>
                <BidFormDialog
                  contract={contract}
                  bid={bid}
                  triggerRender={<button type="button" aria-label="Editar lance" />}
                  triggerClassName="text-card-beige-muted-foreground transition-colors hover:text-accent"
                  triggerChildren={<Pencil className="h-3.5 w-3.5" />}
                />
                <button
                  type="button"
                  aria-label="Excluir lance"
                  onClick={() => deleteBid(bid.id, contract.id, contract.clientId)}
                  className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
