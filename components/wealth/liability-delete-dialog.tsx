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
import { deleteLiability } from "@/lib/actions/liabilities";
import type { LiabilityDetail } from "@/lib/data/wealth";

export function LiabilityDeleteDialog({ liability }: { liability: LiabilityDetail }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await deleteLiability(liability.id);
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Excluir passivo" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir passivo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-card-beige-muted-foreground">
          Isso vai excluir permanentemente <strong className="text-foreground">{liability.name}</strong> do
          registro de passivos. Essa ação não pode ser desfeita.
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
