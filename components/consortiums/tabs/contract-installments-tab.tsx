"use client";

import { Plus, Trash2 } from "lucide-react";
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
import { InstallmentAdjustDialog } from "@/components/consortiums/parcelas/installment-adjust-dialog";
import { InstallmentMarkPaidDialog } from "@/components/consortiums/parcelas/installment-mark-paid-dialog";
import { InstallmentNegotiateDialog } from "@/components/consortiums/parcelas/installment-negotiate-dialog";
import { addInstallment, deleteInstallment } from "@/lib/actions/consortiums";
import type { ConsortiumContract, ConsortiumInstallment } from "@/lib/data/consortiums";
import {
  INSTALLMENT_STATUS_OPTIONS,
  INSTALLMENT_STATUS_VARIANT,
  installmentStatusLabel,
  isEffectivelyOverdue,
} from "@/lib/utils/installment-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function AddInstallmentDialog({ contract }: { contract: ConsortiumContract }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("pending");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const paidAmount = form.get("paidAmount");
    const paidAt = String(form.get("paidAt") ?? "");

    await addInstallment(contract.id, contract.clientId, {
      installmentNumber: Number(form.get("installmentNumber") ?? 0),
      dueDate: String(form.get("dueDate") ?? "") || null,
      amount: Number(form.get("amount") ?? 0),
      paidAmount: paidAmount ? Number(paidAmount) : null,
      paidAt: paidAt || null,
      status,
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-3.5 w-3.5" />
        Registrar parcela
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar parcela</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input name="installmentNumber" type="number" placeholder="Nº da parcela" required />
            <Input name="amount" type="number" step="0.01" placeholder="Valor" required />
          </div>
          <Input name="dueDate" type="date" placeholder="Vencimento" />
          <Select value={status} onValueChange={(v) => setStatus(v ?? "pending")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {INSTALLMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {installmentStatusLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status === "paid" ? (
            <div className="grid grid-cols-2 gap-3">
              <Input name="paidAmount" type="number" step="0.01" placeholder="Valor pago" />
              <Input name="paidAt" type="date" placeholder="Data do pagamento" />
            </div>
          ) : null}
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

export function ContractInstallmentsTab({
  contract,
  installments,
}: {
  contract: ConsortiumContract;
  installments: ConsortiumInstallment[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-card-beige-muted-foreground">
            Resumo do contrato: {contract.paidInstallments}/{contract.totalInstallments} parcelas pagas
            (contador oficial). A lista abaixo é o detalhamento parcela a parcela, registrado conforme os
            pagamentos acontecem.
          </p>
        </div>
        <AddInstallmentDialog contract={contract} />
      </div>

      {installments.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma parcela detalhada registrada ainda. Use &ldquo;Registrar parcela&rdquo; pra começar o
            detalhamento — o contador oficial acima continua sendo a fonte da verdade até então.
          </p>
        </div>
      ) : (
        <div className="card-premium overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/5 text-left">
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Nº</th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Vencimento</th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Pago em</th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => {
                const late = isEffectivelyOverdue(installment);
                return (
                  <tr key={installment.id} className="group border-b border-black/10 last:border-b-0 hover:bg-black/5">
                    <td className="px-4 py-3 font-semibold text-foreground">{installment.installmentNumber}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(installment.dueDate)}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrencyBRL(installment.amount)}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {installment.paidAt ? formatDate(installment.paidAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={INSTALLMENT_STATUS_VARIANT[late ? "overdue" : installment.status] ?? "outline"}>
                        {installmentStatusLabel(late ? "overdue" : installment.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {installment.status !== "paid" ? (
                          <InstallmentMarkPaidDialog installment={installment} />
                        ) : null}
                        <InstallmentNegotiateDialog installment={installment} />
                        <InstallmentAdjustDialog installment={installment} />
                        <button
                          type="button"
                          aria-label="Excluir parcela"
                          onClick={() => deleteInstallment(installment.id, contract.id, contract.clientId)}
                          className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
