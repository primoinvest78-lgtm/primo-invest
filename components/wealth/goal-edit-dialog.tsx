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
import { updateGoal } from "@/lib/actions/goals";
import type { GoalDetail } from "@/lib/data/wealth";

export function GoalEditDialog({
  goal,
  clients,
}: {
  goal: GoalDetail;
  clients: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState(goal.priority);
  const [status, setStatus] = useState(goal.status);
  const [clientId, setClientId] = useState(goal.clientId ?? "none");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const targetDate = String(form.get("targetDate") ?? "");

    await updateGoal(goal.id, {
      name: String(form.get("name") ?? ""),
      goalType: String(form.get("goalType") ?? ""),
      targetAmount: Number(form.get("targetAmount") ?? 0),
      currentAmount: Number(form.get("currentAmount") ?? 0),
      targetDate: targetDate || null,
      priority,
      status,
      clientId: clientId === "none" ? null : clientId,
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar meta" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="name" placeholder="Nome da meta" required defaultValue={goal.name} />
          <Input
            name="goalType"
            placeholder="Categoria (ex: aposentadoria)"
            required
            defaultValue={goal.goalType ?? ""}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="targetAmount"
              type="number"
              step="0.01"
              placeholder="Valor objetivo"
              required
              defaultValue={goal.targetAmount ?? ""}
            />
            <Input
              name="currentAmount"
              type="number"
              step="0.01"
              placeholder="Valor atual"
              required
              defaultValue={goal.currentAmount}
            />
          </div>

          <Input name="targetDate" type="date" defaultValue={goal.targetDate ?? ""} />

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

          <div className="grid grid-cols-2 gap-3">
            <Select value={priority} onValueChange={(v) => setPriority(v ?? "normal")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v ?? "active")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
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
