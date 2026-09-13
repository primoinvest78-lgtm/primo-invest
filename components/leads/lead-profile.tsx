"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Pencil } from "lucide-react";
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
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import {
  convertLeadToClient,
  createInteraction,
  createLeadNote,
  updateLeadProfile,
} from "@/lib/actions/leads";
import { deleteTask } from "@/lib/actions/tasks";
import type { LeadProfile } from "@/lib/data/leads";
import {
  computeLeadPriorityLabel,
  computeLeadScore,
  LEAD_PRIORITY_BADGE_CLASS,
  LEAD_TIER_BADGE_CLASS,
  type LeadScorable,
} from "@/lib/utils/lead-score";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";

const INTERACTION_LABEL: Record<string, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  message: "Mensagem",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

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
              <SelectItem value="message">Mensagem</SelectItem>
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

function NewLeadNoteDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await createLeadNote(leadId, {
      title: String(form.get("title") ?? ""),
      content: String(form.get("content") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Nova observação</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar observação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título (opcional)" />
          <Textarea name="content" placeholder="Conteúdo" rows={4} required />
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

function EditLeadProfileDialog({ lead }: { lead: LeadProfile }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const netWorth = String(form.get("estimatedNetWorth") ?? "");

    await updateLeadProfile(lead.id, {
      source: String(form.get("source") ?? "") || null,
      interest: String(form.get("interest") ?? "") || null,
      productInterest: String(form.get("productInterest") ?? "") || null,
      estimatedNetWorth: netWorth ? Number(netWorth) : null,
      objective: String(form.get("objective") ?? "") || null,
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar perfil de qualificação" />}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/60 hover:text-primary"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar qualificação
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qualificação do lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="source" placeholder="Origem" defaultValue={lead.source ?? ""} />
          <Input name="interest" placeholder="Interesse" defaultValue={lead.interest ?? ""} />
          <Input
            name="productInterest"
            placeholder="Produto de interesse"
            defaultValue={lead.product_interest ?? ""}
          />
          <Input
            name="estimatedNetWorth"
            type="number"
            step="0.01"
            placeholder="Patrimônio estimado"
            defaultValue={lead.estimated_net_worth ?? ""}
          />
          <Textarea
            name="objective"
            placeholder="Objetivo"
            rows={3}
            defaultValue={lead.objective ?? ""}
          />
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

type TimelineEntry = {
  id: string;
  kind: "interaction" | "task" | "note" | "stage";
  date: string;
  title: string;
  description: string | null;
};

export function LeadProfileView({ lead }: { lead: LeadProfile }) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);

  const pendingTasks = lead.tasks
    .filter((t) => t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"));
  const nextTask = pendingTasks[0] ?? null;

  const lastInteractionAt = lead.interactions.length
    ? [...lead.interactions].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0].occurred_at
    : null;

  const scorable: LeadScorable = {
    id: lead.id,
    status: lead.status,
    interest: lead.interest,
    productInterest: lead.product_interest,
    estimatedNetWorth: lead.estimated_net_worth,
    interactionsCount: lead.interactions.length,
    lastInteractionAt,
    createdAt: lead.created_at,
    nextTask: nextTask ? { dueAt: nextTask.due_at } : null,
  };
  const { score, tier } = computeLeadScore(scorable);
  const priority = computeLeadPriorityLabel(scorable);

  const isOpen = lead.status !== "Convertido" && lead.status !== "Perdido";

  const entries: TimelineEntry[] = [
    ...lead.interactions.map((i) => ({
      id: i.id,
      kind: "interaction" as const,
      date: i.occurred_at,
      title: `${INTERACTION_LABEL[i.interaction_type] ?? i.interaction_type}${i.subject ? ` — ${i.subject}` : ""}`,
      description: i.description,
    })),
    ...lead.tasks.map((t) => ({
      id: t.id,
      kind: "task" as const,
      date: t.due_at ?? lead.created_at,
      title: `Tarefa: ${t.title}`,
      description: t.description,
    })),
    ...lead.lead_notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      date: n.created_at,
      title: n.title ?? "Observação",
      description: n.content,
    })),
    ...lead.lead_status_history.map((h) => ({
      id: h.id,
      kind: "stage" as const,
      date: h.created_at,
      title: h.from_status
        ? `Mudou de etapa: "${h.from_status}" → "${h.to_status}"`
        : `Entrou no pipeline em "${h.to_status}"`,
      description: null,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  async function handleConvert() {
    setConverting(true);
    const clientId = await convertLeadToClient(lead.id);
    router.push(`/clientes/${clientId}`);
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTask(taskId, { leadId: lead.id });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 card-premium rounded-2xl p-5 md:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Contato</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {lead.email ?? "—"} {lead.phone ? `· ${lead.phone}` : ""}
              </p>
            </div>
            <div>
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Origem</p>
              <p className="mt-1 text-sm font-medium text-foreground">{lead.source ?? "—"}</p>
            </div>
            <div>
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Etapa</p>
              <Badge className="mt-1">{lead.status}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
                LEAD_TIER_BADGE_CLASS[tier],
              ].join(" ")}
            >
              Score {score} · {tier}
            </span>
            <span
              className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
                LEAD_PRIORITY_BADGE_CLASS[priority],
              ].join(" ")}
            >
              Prioridade {priority}
            </span>
          </div>
        </div>

        {lead.status === "Perdido" && lead.lost_reason ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">
            Motivo da perda: {lead.lost_reason}
            {lead.lost_at ? ` · ${formatDate(lead.lost_at)}` : ""}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <EditLeadProfileDialog lead={lead} />
          {isOpen ? (
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? "Convertendo..." : "Converter em Cliente"}
            </Button>
          ) : null}
        </div>
      </motion.div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Qualificação</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Interesse" value={lead.interest} />
          <Field label="Produto de interesse" value={lead.product_interest} />
          <Field
            label="Patrimônio estimado"
            value={lead.estimated_net_worth ? formatCurrencyBRL(lead.estimated_net_worth) : null}
          />
          <Field label="Objetivo" value={lead.objective} />
          <Field label="Responsável" value={lead.assigned_advisor?.full_name} />
          <Field
            label="Próxima ação"
            value={
              nextTask
                ? `${nextTask.title}${nextTask.due_at ? ` · ${formatDate(nextTask.due_at)}` : ""}`
                : null
            }
          />
        </div>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-h2 font-bold text-foreground">Linha do tempo</h3>
          <div className="flex flex-wrap gap-2">
            <NewInteractionDialog leadId={lead.id} />
            <NewTaskDialog leadId={lead.id} />
            <NewLeadNoteDialog leadId={lead.id} />
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma interação, tarefa ou observação registrada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={`${entry.kind}-${entry.id}`}
                className="rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-xs font-medium text-card-beige-muted-foreground">
                      {formatDateTime(entry.date)}
                    </p>
                    {entry.kind === "task" ? (
                      <button
                        type="button"
                        aria-label="Excluir tarefa"
                        onClick={() => handleDeleteTask(entry.id)}
                        className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
                {entry.description ? (
                  <p className="mt-1 text-xs text-card-beige-muted-foreground">{entry.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
