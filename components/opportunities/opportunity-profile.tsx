"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createOpportunityActivity,
  markOpportunityWonLost,
} from "@/lib/actions/opportunities";
import type { OpportunityProfile } from "@/lib/data/opportunities";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";

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
  note: "Anotação",
};

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
              <SelectItem value="note">Anotação</SelectItem>
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

export function OpportunityProfileView({
  opportunity,
  wonStageId,
  lostStageId,
}: {
  opportunity: OpportunityProfile;
  wonStageId: string;
  lostStageId: string;
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const sortedActivities = [...opportunity.opportunity_activities].sort((a, b) =>
    b.activity_at.localeCompare(a.activity_at),
  );

  const isOpen = opportunity.status !== "won" && opportunity.status !== "lost";

  async function handleWin() {
    setProcessing(true);
    await markOpportunityWonLost(opportunity.id, { outcome: "won", stageId: wonStageId });
    setProcessing(false);
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
          <Badge variant={opportunity.status === "won" ? "default" : "destructive"}>
            {opportunity.status === "won" ? "Ganha" : `Perdida — ${opportunity.loss_reason}`}
          </Badge>
        )}
      </motion.div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-h2 font-bold text-foreground">Linha do tempo</h3>
          <NewActivityDialog opportunityId={opportunity.id} />
        </div>
        {sortedActivities.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma atividade registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {ACTIVITY_LABEL[activity.activity_type] ?? activity.activity_type}
                  </p>
                  <p className="shrink-0 text-xs font-medium text-card-beige-muted-foreground">
                    {formatDateTime(activity.activity_at)}
                  </p>
                </div>
                {activity.description ? (
                  <p className="mt-1 text-xs text-card-beige-muted-foreground">
                    {activity.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
