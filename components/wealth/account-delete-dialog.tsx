"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/actions/accounts";
import type { AccountDetail } from "@/lib/data/wealth";

export function AccountDeleteDialog({
  account,
  onDeleted,
}: {
  account: AccountDetail;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await deleteAccount(account.id);
    setLoading(false);
    setOpen(false);
    onDeleted?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Excluir conta" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-card-beige-muted-foreground">
          Isso vai excluir permanentemente a conta{" "}
          <strong className="text-foreground">
            {account.accountName ?? account.institutionName ?? "sem nome"}
          </strong>
          , incluindo {account.holdings.length}{" "}
          {account.holdings.length === 1 ? "investimento vinculado" : "investimentos vinculados"} e todo o
          histórico de movimentações. Essa ação não pode ser desfeita.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Excluindo..." : "Excluir permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
