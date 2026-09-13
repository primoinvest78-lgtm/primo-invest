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
import { deleteGoal } from "@/lib/actions/goals";
import type { GoalDetail } from "@/lib/data/wealth";

export function GoalDeleteDialog({ goal }: { goal: GoalDetail }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await deleteGoal(goal.id);
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Excluir meta" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir meta</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-card-beige-muted-foreground">
          Isso vai excluir permanentemente a meta <strong className="text-foreground">{goal.name}</strong>
          {goal.accounts.length > 0
            ? ` e desvincular ${goal.accounts.length} ${goal.accounts.length === 1 ? "conta associada" : "contas associadas"} (as contas em si não são afetadas)`
            : ""}
          . Essa ação não pode ser desfeita.
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
