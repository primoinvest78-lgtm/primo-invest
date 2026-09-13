"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
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
import { createInteraction, createLeadTask, convertLeadToClient } from "@/lib/actions/leads";
import type { LeadProfile } from "@/lib/data/leads";
import { formatDateTime } from "@/lib/utils/format";

const INTERACTION_LABEL: Record<string, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
};

function NewInteractionDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("call");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await createInteraction(leadId, {
      interactionType: type,
      subject: String(form.get("subject") ?? ""),
      description: String(form.get("description") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Nova interação
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar interação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={type} onValueChange={(v) => setType(v ?? "call")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Ligação</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
            </SelectContent>
          </Select>
          <Input name="subject" placeholder="Assunto" required />
          <Textarea name="description" placeholder="Descrição" rows={3} />
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

function NewTaskDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const dueAt = String(form.get("dueAt") ?? "");

    await createLeadTask(leadId, {
      title: String(form.get("title") ?? ""),
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      priority: "normal",
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Nova tarefa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título" required />
          <Input name="dueAt" type="datetime-local" />
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

export function LeadProfileView({ lead }: { lead: LeadProfile }) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);

  const sortedInteractions = [...lead.interactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  );
  const sortedTasks = [...lead.tasks].sort((a, b) =>
    (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"),
  );

  async function handleConvert() {
    setConverting(true);
    const clientId = await convertLeadToClient(lead.id);
    router.push(`/clientes/${clientId}`);
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 md:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-label font-bold uppercase text-muted-foreground">Contato</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {lead.email ?? "—"} {lead.phone ? `· ${lead.phone}` : ""}
            </p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-muted-foreground">Origem</p>
            <p className="mt-1 text-sm font-medium text-foreground">{lead.source ?? "—"}</p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-muted-foreground">Status</p>
            <Badge className="mt-1">{lead.status}</Badge>
          </div>
        </div>

        {lead.status === "Qualificado" && !lead.converted_client_id ? (
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? "Convertendo..." : "Converter em Cliente"}
          </Button>
        ) : null}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h2 font-bold text-foreground">Atividade</h3>
            <NewInteractionDialog leadId={lead.id} />
          </div>
          {sortedInteractions.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nenhuma interação registrada.</p>
          ) : (
            <div className="space-y-2">
              {sortedInteractions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-muted/60 px-3.5 py-3 transition-colors duration-150 hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {INTERACTION_LABEL[item.interaction_type] ?? item.interaction_type}
                      {item.subject ? ` — ${item.subject}` : ""}
                    </p>
                    <p className="shrink-0 text-xs font-medium text-muted-foreground">
                      {formatDateTime(item.occurred_at)}
                    </p>
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h2 font-bold text-foreground">Próximas tarefas</h3>
            <NewTaskDialog leadId={lead.id} />
          </div>
          {sortedTasks.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
          ) : (
            <div className="space-y-2">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/60 px-3.5 py-3 transition-colors duration-150 hover:bg-muted"
                >
                  <p className="text-sm font-semibold text-foreground">{task.title}</p>
                  {task.due_at ? (
                    <p className="shrink-0 text-xs font-medium text-muted-foreground">
                      {formatDateTime(task.due_at)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
