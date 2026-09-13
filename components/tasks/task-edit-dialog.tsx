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
import { updateTask } from "@/lib/actions/tasks";
import type { TaskFormOptions, TaskItem } from "@/lib/data/tasks";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL, TASK_CATEGORIES } from "@/lib/utils/task-helpers";

const NONE = "none";

export function TaskEditDialog({ task, options }: { task: TaskItem; options: TaskFormOptions }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState(task.priority);
  const [category, setCategory] = useState(task.category ?? NONE);
  const [advisorId, setAdvisorId] = useState(task.assignedToId ?? NONE);
  const [status, setStatus] = useState(task.status);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const dueAt = String(form.get("dueAt") ?? "");

    await updateTask(
      task.id,
      {
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? "") || null,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
        category: category === NONE ? null : category,
        assignedTo: advisorId === NONE ? null : advisorId,
        status,
      },
      { clientId: task.clientId ?? undefined, opportunityId: task.opportunityId ?? undefined, leadId: task.leadId ?? undefined },
    );

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar tarefa" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título" required defaultValue={task.title} />
          <Textarea
            name="description"
            placeholder="Descrição / observações"
            rows={3}
            defaultValue={task.description ?? ""}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              name="dueAt"
              type="datetime-local"
              defaultValue={task.dueAt ? task.dueAt.slice(0, 16) : ""}
            />

            <Select value={priority} onValueChange={(v) => setPriority(v ?? "normal")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={advisorId} onValueChange={(v) => setAdvisorId(v ?? NONE)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem responsável</SelectItem>
                {options.advisors.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v ?? "pending")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={category} onValueChange={(v) => setCategory(v ?? NONE)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem categoria</SelectItem>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {CATEGORY_LABEL[c.value]}
                </SelectItem>
              ))}
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
