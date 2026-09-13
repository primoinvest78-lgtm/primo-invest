"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { deleteTask } from "@/lib/actions/tasks";
import {
  createOpportunityActivity,
  markOpportunityWonLost,
  updateOpportunityProfile,
} from "@/lib/actions/opportunities";
import type { ClientSummary, OpportunityProfile } from "@/lib/data/opportunities";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";
import { OPPORTUNITY_TYPES, PRIORITY_LABEL } from "@/lib/utils/opportunity-helpers";

const LOSS_REASONS = [
  "Preço",
  "Concorrência",
  "Timing / adiado",
  "Sem orçamento",
  "Perfil não adequado",
  "Outro",
];

const ACTIVITY_LABEL: Record<string, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  proposal: "Proposta enviada",
  note: "Observação",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function NewActivityDialog({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("call");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await createOpportunityActivity(opportunityId, {
      activityType: type,
      description: String(form.get("description") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Nova atividade
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar atividade</DialogTitle>
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
              <SelectItem value="proposal">Proposta enviada</SelectItem>
              <SelectItem value="note">Observação</SelectItem>
            </SelectContent>
          </Select>
          <Textarea name="description" placeholder="Descrição" rows={3} required />
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

function MarkLostDialog({
  opportunityId,
  lostStageId,
  onDone,
}: {
  opportunityId: string;
  lostStageId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState(LOSS_REASONS[0]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") ?? "");

    await markOpportunityWonLost(opportunityId, {
      outcome: "lost",
      lossReason: note ? `${reason} — ${note}` : reason,
      stageId: lostStageId,
    });

    setLoading(false);
    setOpen(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" />}>
        Marcar como Perdida
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Por que essa oportunidade foi perdida?</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={reason} onValueChange={(v) => setReason(v ?? LOSS_REASONS[0])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Motivo" />
            </SelectTrigger>
            <SelectContent>
              {LOSS_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea name="note" placeholder="Detalhe rápido (opcional, mas ajuda a aprender)" rows={2} />
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar perda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditOpportunityDialog({ opportunity }: { opportunity: OpportunityProfile }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState(opportunity.priority);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const value = String(form.get("estimatedValue") ?? "");
    const probability = String(form.get("probability") ?? "");
    const closeDate = String(form.get("expectedCloseDate") ?? "");

    await updateOpportunityProfile(opportunity.id, {
      product: String(form.get("product") ?? "") || null,
      source: String(form.get("source") ?? "") || null,
      priority,
      probability: probability ? Number(probability) : null,
      estimatedValue: value ? Number(value) : null,
      expectedCloseDate: closeDate || null,
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar oportunidade" />}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/60 hover:text-primary"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="product" placeholder="Produto" defaultValue={opportunity.product ?? ""} />
          <Input name="source" placeholder="Origem" defaultValue={opportunity.source ?? ""} />
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
          <Input
            name="probability"
            type="number"
            min="0"
            max="100"
            placeholder="Probabilidade (%)"
            defaultValue={opportunity.probability ?? ""}
          />
          <Input
            name="estimatedValue"
            type="number"
            step="0.01"
            placeholder="Valor estimado"
            defaultValue={opportunity.estimated_value ?? ""}
          />
          <Input
            name="expectedCloseDate"
            type="date"
            defaultValue={opportunity.expected_close_date ?? ""}
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
  date: string;
  title: string;
  description: string | null;
};

export function OpportunityProfileView({
  opportunity,
  wonStageId,
  lostStageId,
  clientSummary,
}: {
  opportunity: OpportunityProfile;
  wonStageId: string;
  lostStageId: string;
  clientSummary: ClientSummary | null;
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const isOpen = opportunity.status !== "won" && opportunity.status !== "lost";

  const pendingTasks = opportunity.tasks
    .filter((t) => t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"));

  const typeLabel =
    OPPORTUNITY_TYPES.find((t) => t.value === opportunity.opportunity_type)?.label ??
    opportunity.opportunity_type;

  const entries: TimelineEntry[] = [
    {
      id: "created",
      date: opportunity.created_at,
      title: "Oportunidade criada",
      description: null,
    },
    ...opportunity.opportunity_activities.map((a) => ({
      id: `activity-${a.id}`,
      date: a.activity_at,
      title: ACTIVITY_LABEL[a.activity_type] ?? a.activity_type,
      description: a.description,
    })),
    ...opportunity.opportunity_history.map((h) => ({
      id: `history-${h.id}`,
      date: h.created_at,
      title:
        h.event_type === "stage_change"
          ? `Mudou de etapa: "${h.from_value ?? "—"}" → "${h.to_value ?? "—"}"`
          : `Valor alterado: ${formatCurrencyBRL(h.from_value ? Number(h.from_value) : null)} → ${formatCurrencyBRL(h.to_value ? Number(h.to_value) : null)}`,
      description: null,
    })),
    ...pendingTasks.map((t) => ({
      id: `task-${t.id}`,
      date: t.due_at ?? opportunity.created_at,
      title: `Tarefa: ${t.title}`,
      description: t.description,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  async function handleWin() {
    setProcessing(true);
    await markOpportunityWonLost(opportunity.id, { outcome: "won", stageId: wonStageId });
    setProcessing(false);
    router.refresh();
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTask(taskId, { opportunityId: opportunity.id });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-premium flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 md:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Cliente/Lead
            </p>
            {opportunity.client ? (
              <Link
                href={`/clientes/${opportunity.client.id}`}
                className="mt-1 block text-sm font-semibold text-accent hover:underline"
              >
                {opportunity.client.full_name}
              </Link>
            ) : opportunity.lead ? (
              <Link
                href={`/leads/${opportunity.lead.id}`}
                className="mt-1 block text-sm font-semibold text-accent hover:underline"
              >
                {opportunity.lead.name}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-foreground">—</p>
            )}
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Valor estimado
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrencyBRL(opportunity.estimated_value)}
            </p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Previsão
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(opportunity.expected_close_date)}
            </p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Estágio
            </p>
            <Badge className="mt-1">{opportunity.opportunity_stages?.name ?? "—"}</Badge>
          </div>
        </div>

        {isOpen ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleWin} disabled={processing}>
              {processing ? "Salvando..." : "Marcar como Ganha"}
            </Button>
            <MarkLostDialog
              opportunityId={opportunity.id}
              lostStageId={lostStageId}
              onDone={() => router.refresh()}
            />
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Badge variant={opportunity.status === "won" ? "default" : "destructive"}>
              {opportunity.status === "won" ? "Ganha" : "Perdida"}
            </Badge>
            {opportunity.status === "lost" && opportunity.loss_reason ? (
              <p className="text-xs text-card-beige-muted-foreground">{opportunity.loss_reason}</p>
            ) : null}
            {opportunity.closed_at ? (
              <p className="text-xs text-card-beige-muted-foreground">
                {formatDate(opportunity.closed_at)}
              </p>
            ) : null}
          </div>
        )}
      </motion.div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-h2 font-bold text-foreground">Detalhes</h3>
          <EditOpportunityDialog opportunity={opportunity} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Categoria" value={typeLabel} />
          <Field label="Produto" value={opportunity.product} />
          <Field label="Origem" value={opportunity.source} />
          <Field
            label="Prioridade"
            value={PRIORITY_LABEL[opportunity.priority] ?? opportunity.priority}
          />
          <Field
            label="Probabilidade"
            value={
              opportunity.probability !== null
                ? `${opportunity.probability}%`
                : opportunity.opportunity_stages?.probability !== null &&
                    opportunity.opportunity_stages?.probability !== undefined
                  ? `${opportunity.opportunity_stages.probability}% (padrão da etapa)`
                  : null
            }
          />
          <Field label="Responsável" value={opportunity.assigned_advisor?.full_name} />
        </div>
      </div>

      {clientSummary ? (
        <div className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">
            Resumo do cliente — {clientSummary.fullName}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-xl border border-black/10 bg-black/5 p-3">
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
                Patrimônio
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatCurrencyBRL(clientSummary.netWorth)}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/5 p-3">
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
                Investimentos
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatCurrencyBRL(clientSummary.investmentsTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/5 p-3">
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
                Consórcios
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatCurrencyBRL(clientSummary.consortiumTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/5 p-3">
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
                Metas ativas
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">{clientSummary.activeGoals}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/5 p-3">
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
                Último contato
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatDate(clientSummary.lastInteractionAt)}
              </p>
            </div>
          </div>

          {clientSummary.otherOpportunities.length > 0 ? (
            <div className="mt-4 border-t border-black/10 pt-4">
              <p className="mb-2 text-label font-bold uppercase text-card-beige-muted-foreground">
                Outras oportunidades deste cliente
              </p>
              <div className="space-y-1.5">
                {clientSummary.otherOpportunities.map((o) => (
                  <Link
                    key={o.id}
                    href={`/oportunidades/${o.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-black/10"
                  >
                    <span className="truncate font-medium text-foreground">{o.title}</span>
                    <span className="shrink-0 text-card-beige-muted-foreground">
                      {formatCurrencyBRL(o.estimatedValue)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-h2 font-bold text-foreground">Próximas ações</h3>
          <NewTaskDialog opportunityId={opportunity.id} />
        </div>
        {pendingTasks.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma tarefa pendente.</p>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/60 px-3.5 py-3 transition-colors duration-150 hover:bg-muted"
              >
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {task.due_at ? (
                    <p className="text-xs font-medium text-card-beige-muted-foreground">
                      {formatDateTime(task.due_at)}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Excluir tarefa"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="card-premium rounded-2xl p-5 md:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-h2 font-bold text-foreground">Linha do tempo</h3>
          <NewActivityDialog opportunityId={opportunity.id} />
        </div>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                <p className="shrink-0 text-xs font-medium text-card-beige-muted-foreground">
                  {formatDateTime(entry.date)}
                </p>
              </div>
              {entry.description ? (
                <p className="mt-1 text-xs text-card-beige-muted-foreground">{entry.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
