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
import { Textarea } from "@/components/ui/textarea";
import { updateContract } from "@/lib/actions/consortiums";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import { CONTRACT_STATUS_OPTIONS, contractStatusLabel } from "@/lib/utils/consortium-helpers";

export function ContractEditDialog({
  contract,
  clients,
}: {
  contract: ConsortiumContract;
  clients: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(contract.status);
  const [clientId, setClientId] = useState(contract.clientId ?? "none");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    function num(name: string): number | null {
      const raw = form.get(name);
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }

    await updateContract(contract.id, {
      administratorName: String(form.get("administratorName") ?? ""),
      contractNumber: String(form.get("contractNumber") ?? ""),
      consortiumType: String(form.get("consortiumType") ?? ""),
      groupNumber: String(form.get("groupNumber") ?? ""),
      quotaNumber: String(form.get("quotaNumber") ?? ""),
      assetDescription: String(form.get("assetDescription") ?? ""),
      creditAmount: num("creditAmount") ?? 0,
      installmentAmount: num("installmentAmount"),
      totalInstallments: num("totalInstallments") ?? 0,
      paidInstallments: num("paidInstallments") ?? 0,
      adminFeePercentage: num("adminFeePercentage"),
      reserveFundPercentage: num("reserveFundPercentage"),
      insuranceAmount: num("insuranceAmount"),
      startDate: String(form.get("startDate") ?? "") || null,
      endDate: String(form.get("endDate") ?? "") || null,
      contemplatedAt: String(form.get("contemplatedAt") ?? "") || null,
      status,
      clientId: clientId === "none" ? null : clientId,
      notes: String(form.get("notes") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar contrato" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Consórcio</p>
            <div className="grid grid-cols-2 gap-3">
              <Input name="administratorName" placeholder="Administradora" required defaultValue={contract.administratorName ?? ""} />
              <Input name="contractNumber" placeholder="Nº do contrato" defaultValue={contract.contractNumber ?? ""} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input name="consortiumType" placeholder="Tipo (ex: imóvel)" required defaultValue={contract.consortiumType ?? ""} />
              <Input name="groupNumber" placeholder="Grupo" defaultValue={contract.groupNumber ?? ""} />
              <Input name="quotaNumber" placeholder="Cota" defaultValue={contract.quotaNumber ?? ""} />
            </div>
            <Input name="assetDescription" placeholder="Bem/serviço (ex: Apartamento 3 quartos)" defaultValue={contract.assetDescription ?? ""} />
          </div>

          <div className="space-y-3 border-t border-black/10 pt-4">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Financeiro</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="creditAmount"
                type="number"
                step="0.01"
                placeholder="Valor do crédito"
                required
                defaultValue={contract.creditAmount ?? ""}
              />
              <Input
                name="installmentAmount"
                type="number"
                step="0.01"
                placeholder="Valor da parcela"
                defaultValue={contract.installmentAmount ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="totalInstallments"
                type="number"
                placeholder="Total de parcelas"
                required
                defaultValue={contract.totalInstallments}
              />
              <Input
                name="paidInstallments"
                type="number"
                placeholder="Parcelas pagas"
                required
                defaultValue={contract.paidInstallments}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                name="adminFeePercentage"
                type="number"
                step="0.01"
                placeholder="Taxa adm. (%)"
                defaultValue={contract.adminFeePercentage ?? ""}
              />
              <Input
                name="reserveFundPercentage"
                type="number"
                step="0.01"
                placeholder="Fundo reserva (%)"
                defaultValue={contract.reserveFundPercentage ?? ""}
              />
              <Input
                name="insuranceAmount"
                type="number"
                step="0.01"
                placeholder="Seguro (R$)"
                defaultValue={contract.insuranceAmount ?? ""}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-black/10 pt-4">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Datas</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Adesão/início</label>
                <Input name="startDate" type="date" defaultValue={contract.startDate ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Prazo final</label>
                <Input name="endDate" type="date" defaultValue={contract.endDate ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Contemplação</label>
                <Input name="contemplatedAt" type="date" defaultValue={contract.contemplatedAt ?? ""} />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-black/10 pt-4">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Cliente e status</p>
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
                {CONTRACT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {contractStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-4">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Observações</p>
            <Textarea name="notes" placeholder="Observações internas sobre o contrato" rows={3} defaultValue={contract.notes ?? ""} />
          </div>

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
