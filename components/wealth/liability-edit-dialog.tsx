"use client";

import { Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLiability } from "@/lib/actions/liabilities";
import type { LiabilityDetail } from "@/lib/data/wealth";

export function LiabilityEditDialog({
  liability,
  clients,
}: {
  liability: LiabilityDetail;
  clients: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(liability.status);
  const [clientId, setClientId] = useState(liability.clientId ?? "none");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const outstanding = Number(form.get("outstandingAmount") ?? 0);
    const interestRate = form.get("interestRate");
    const monthlyPayment = form.get("monthlyPayment");
    const maturityDate = String(form.get("maturityDate") ?? "");

    await updateLiability(liability.id, {
      name: String(form.get("name") ?? ""),
      liabilityType: String(form.get("liabilityType") ?? ""),
      outstandingAmount: outstanding,
      interestRate: interestRate ? Number(interestRate) : null,
      monthlyPayment: monthlyPayment ? Number(monthlyPayment) : null,
      maturityDate: maturityDate || null,
      currency: String(form.get("currency") ?? "BRL"),
      status,
      clientId: clientId === "none" ? null : clientId,
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar passivo" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar passivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="name" placeholder="Descrição" required defaultValue={liability.name} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="liabilityType"
              placeholder="Categoria (ex: financiamento)"
              required
              defaultValue={liability.liabilityType ?? ""}
            />
            <Input name="currency" placeholder="Moeda" required defaultValue={liability.currency} maxLength={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="outstandingAmount"
              type="number"
              step="0.01"
              placeholder="Saldo atual"
              required
              defaultValue={liability.outstandingAmount ?? ""}
            />
            <Input
              name="monthlyPayment"
              type="number"
              step="0.01"
              placeholder="Parcela mensal"
              defaultValue={liability.monthlyPayment ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="interestRate"
              type="number"
              step="0.01"
              placeholder="Taxa de juros (% a.m.)"
              defaultValue={liability.interestRate ?? ""}
            />
            <Input name="maturityDate" type="date" defaultValue={liability.maturityDate ?? ""} />
          </div>

          <Select value={clientId} onValueChange={(v) => setClientId(v ?? "none")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Titular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem cliente vinculado</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v ?? "active")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>

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
