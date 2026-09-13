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
import { updateAccount } from "@/lib/actions/accounts";
import type { AccountDetail } from "@/lib/data/wealth";

export function AccountEditDialog({
  account,
  clients,
}: {
  account: AccountDetail;
  clients: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(account.status);
  const [clientId, setClientId] = useState(account.clientId ?? "none");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await updateAccount(account.id, {
      accountName: String(form.get("accountName") ?? ""),
      institutionName: String(form.get("institutionName") ?? ""),
      accountType: String(form.get("accountType") ?? ""),
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
        render={<button type="button" aria-label="Editar conta" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="accountName" placeholder="Nome da conta" required defaultValue={account.accountName ?? ""} />
          <Input
            name="institutionName"
            placeholder="Instituição"
            required
            defaultValue={account.institutionName ?? ""}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input name="accountType" placeholder="Tipo (ex: corrente)" required defaultValue={account.accountType} />
            <Input name="currency" placeholder="Moeda" required defaultValue={account.currency} maxLength={3} />
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
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="inactive">Inativa</SelectItem>
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
