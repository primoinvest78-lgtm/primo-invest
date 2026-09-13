"use client";

import { TrendingUp } from "lucide-react";
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
import { recordInstallmentAdjustment } from "@/lib/actions/consortiums";
import type { ConsortiumInstallment } from "@/lib/data/consortiums";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function InstallmentAdjustDialog({ installment }: { installment: ConsortiumInstallment }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await recordInstallmentAdjustment(installment.id, installment.contractId, installment.clientId, {
      newAmount: Number(form.get("newAmount") ?? 0),
      reason: String(form.get("reason") ?? ""),
      contractualReference: String(form.get("contractualReference") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" />}>
        <TrendingUp className="h-3.5 w-3.5" />
        Reajustar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reajustar parcela {installment.installmentNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-card-beige-muted-foreground">
            Valor atual: {formatCurrencyBRL(installment.amount)}. O valor anterior fica preservado no
            histórico — nenhum recálculo automático é feito aqui.
          </p>
          <Input name="newAmount" type="number" step="0.01" placeholder="Novo valor" required defaultValue={installment.amount ?? ""} />
          <Input name="reason" placeholder="Motivo/regra do reajuste" required />
          <Input name="contractualReference" placeholder="Referência contratual (opcional)" />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar reajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
