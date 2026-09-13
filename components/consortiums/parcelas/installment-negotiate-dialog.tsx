"use client";

import { Handshake } from "lucide-react";
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
import { negotiateInstallment } from "@/lib/actions/consortiums";
import type { ConsortiumInstallment } from "@/lib/data/consortiums";

export function InstallmentNegotiateDialog({ installment }: { installment: ConsortiumInstallment }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await negotiateInstallment(installment.id, installment.contractId, installment.clientId, {
      newDueDate: String(form.get("newDueDate") ?? ""),
      condition: String(form.get("condition") ?? ""),
      notes: String(form.get("notes") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" />}>
        <Handshake className="h-3.5 w-3.5" />
        Negociar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Negociar parcela {installment.installmentNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-card-beige-muted-foreground">
            Vencimento atual: {installment.dueDate ?? "não informado"}. A condição original fica
            preservada no histórico do contrato.
          </p>
          <Input name="newDueDate" type="date" placeholder="Novo vencimento" required />
          <Input name="condition" placeholder="Condição acordada (ex: parcelamento em 2x)" required />
          <Textarea name="notes" placeholder="Observações (opcional)" rows={2} />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar negociação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
