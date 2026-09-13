"use client";

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
import { createTask } from "@/lib/actions/tasks";
import type { TaskFormOptions } from "@/lib/data/tasks";
import { CREATABLE_PRIORITIES, PRIORITY_LABEL, TASK_CATEGORIES } from "@/lib/utils/task-helpers";

const NONE = "none";

export function TaskCreateDialog({ options }: { options: TaskFormOptions }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState(NONE);
  const [clientId, setClientId] = useState(NONE);
  const [advisorId, setAdvisorId] = useState(NONE);
  const [opportunityId, setOpportunityId] = useState(NONE);
  const [leadId, setLeadId] = useState(NONE);
  const [consortiumId, setConsortiumId] = useState(NONE);

  function reset() {
    setPriority("normal");
    setCategory(NONE);
    setClientId(NONE);
    setAdvisorId(NONE);
    setOpportunityId(NONE);
    setLeadId(NONE);
    setConsortiumId(NONE);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const dueAt = String(form.get("dueAt") ?? "");

    await createTask({
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? "") || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      priority,
      category: category === NONE ? null : category,
      clientId: clientId === NONE ? undefined : clientId,
      assignedTo: advisorId === NONE ? null : advisorId,
      opportunityId: opportunityId === NONE ? undefined : opportunityId,
      leadId: leadId === NONE ? undefined : leadId,
      consortiumContractId: consortiumId === NONE ? null : consortiumId,
    });

    setLoading(false);
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nova tarefa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título" required />
          <Textarea name="description" placeholder="Descrição / observações" rows={3} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? NONE)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem cliente</SelectItem>
                {options.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="dueAt" type="datetime-local" />

            <Select value={priority} onValueChange={(v) => setPriority(v ?? "normal")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {CREATABLE_PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRIORITY_LABEL[value]}
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
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={opportunityId} onValueChange={(v) => setOpportunityId(v ?? NONE)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Oportunidade relacionada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhuma</SelectItem>
                {options.opportunities.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={leadId} onValueChange={(v) => setLeadId(v ?? NONE)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lead relacionado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {options.leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={consortiumId} onValueChange={(v) => setConsortiumId(v ?? NONE)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Consórcio relacionado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {options.consortiumContracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
