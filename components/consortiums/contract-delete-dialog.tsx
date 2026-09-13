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
import { deleteContract } from "@/lib/actions/consortiums";
import type { ConsortiumContract } from "@/lib/data/consortiums";

export function ContractDeleteDialog({ contract }: { contract: ConsortiumContract }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await deleteContract(contract.id, contract.clientId);
      setOpen(false);
    } catch {
      setError(
        "Não foi possível excluir: existem tarefas vinculadas a este contrato. Remova ou desvincule as tarefas primeiro.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={<button type="button" aria-label="Excluir contrato" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir contrato</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-card-beige-muted-foreground">
          Isso vai excluir permanentemente o contrato{" "}
          <strong className="text-foreground">
            {contract.administratorName ?? "—"} · {contract.contractNumber ?? "—"}
          </strong>
          , incluindo parcelas, lances, histórico e documentos vinculados a ele. Essa ação não pode ser
          desfeita.
        </p>
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
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
