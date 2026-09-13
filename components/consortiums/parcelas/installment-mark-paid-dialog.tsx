"use client";

import { CheckCircle2 } from "lucide-react";
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
import { markInstallmentPaid } from "@/lib/actions/consortiums";
import type { ConsortiumInstallment } from "@/lib/data/consortiums";

export function InstallmentMarkPaidDialog({ installment }: { installment: ConsortiumInstallment }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await markInstallmentPaid(installment.id, installment.contractId, installment.clientId, {
      paidAmount: Number(form.get("paidAmount") ?? installment.amount ?? 0),
      paidAt: String(form.get("paidAt") ?? new Date().toISOString().slice(0, 10)),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" />}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Registrar pagamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamento da parcela {installment.installmentNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            name="paidAmount"
            type="number"
            step="0.01"
            placeholder="Valor pago"
            defaultValue={installment.amount ?? ""}
            required
          />
          <Input name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
