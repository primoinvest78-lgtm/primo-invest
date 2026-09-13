"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertLeadToClient, updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUSES, LOST_REASONS } from "@/lib/data/lead-statuses";
import type { LeadListItem } from "@/lib/data/leads";
import { computeLeadScore, LEAD_TIER_BADGE_CLASS } from "@/lib/utils/lead-score";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const COLUMN_ACCENT: Record<string, string> = {
  Novo: "border-t-border",
  Contato: "border-t-border",
  Qualificação: "border-t-border",
  Reunião: "border-t-border",
  Proposta: "border-t-accent",
  Negociação: "border-t-accent",
  Convertido: "border-t-primary",
  Perdido: "border-t-destructive/60",
};

function LeadCard({
  lead,
  index,
  onDragStart,
}: {
  lead: LeadListItem;
  index: number;
  onDragStart: (leadId: string) => void;
}) {
  const { score, tier } = computeLeadScore(lead);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className="card-premium cursor-grab rounded-xl p-3 transition-all duration-200 hover:-translate-y-1 hover:border-primary/80 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/leads/${lead.id}`} className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground hover:text-accent">
            {lead.name}
          </p>
        </Link>
        <span
          className={[
            "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
            LEAD_TIER_BADGE_CLASS[tier],
          ].join(" ")}
        >
          {score}
        </span>
      </div>

      <p className="mt-1 text-xs font-medium uppercase text-card-beige-muted-foreground">
        {lead.source ?? "Origem não informada"}
      </p>

      {lead.estimatedNetWorth ? (
        <p className="mt-1.5 text-xs font-semibold text-foreground">
          {formatCurrencyBRL(lead.estimatedNetWorth)}
        </p>
      ) : null}

      {lead.assignedAdvisorName ? (
        <p className="mt-1.5 text-xs font-medium text-foreground">{lead.assignedAdvisorName}</p>
      ) : null}

      {lead.nextTask ? (
        <div className="mt-2 rounded-lg border border-black/10 bg-black/5 px-2 py-1.5">
          <p className="truncate text-xs font-semibold text-foreground">{lead.nextTask.title}</p>
          {lead.nextTask.dueAt ? (
            <p className="text-[11px] font-medium text-card-beige-muted-foreground">
              {formatDate(lead.nextTask.dueAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}

function LostReasonDialog({
  leadId,
  onClose,
  onConfirm,
}: {
  leadId: string | null;
  onClose: () => void;
  onConfirm: (leadId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState(LOST_REASONS[0]);

  return (
    <Dialog open={leadId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo da perda</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={(v) => setReason(v ?? LOST_REASONS[0])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Motivo" />
            </SelectTrigger>
            <SelectContent>
              {LOST_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (leadId) onConfirm(leadId, reason);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LeadsBoard({ leads }: { leads: LeadListItem[] }) {
  const [items, setItems] = useState(leads);
  const [prevLeads, setPrevLeads] = useState(leads);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [lostDialogLeadId, setLostDialogLeadId] = useState<string | null>(null);

  if (leads !== prevLeads) {
    setPrevLeads(leads);
    setItems(leads);
  }

  function applyStatus(leadId: string, status: string) {
    setItems((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
  }

  function handleDrop(status: string) {
    if (!draggingId) return;
    const leadId = draggingId;
    setDraggingId(null);

    if (status === "Perdido") {
      setLostDialogLeadId(leadId);
      return;
    }

    const previousStatus = items.find((l) => l.id === leadId)?.status;
    applyStatus(leadId, status);

    if (status === "Convertido") {
      convertLeadToClient(leadId).catch(() => {
        if (previousStatus) applyStatus(leadId, previousStatus);
      });
      return;
    }

    updateLeadStatus(leadId, status).catch(() => {
      if (previousStatus) applyStatus(leadId, previousStatus);
    });
  }

  function confirmLostReason(leadId: string, reason: string) {
    applyStatus(leadId, "Perdido");
    setLostDialogLeadId(null);
    updateLeadStatus(leadId, "Perdido", reason).catch(() => {
      setItems(leads);
    });
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {LEAD_STATUSES.map((status) => {
          const columnLeads = items.filter((lead) => lead.status === status);

          return (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              className={[
                "card-premium flex w-[270px] shrink-0 flex-col rounded-2xl border-t-2 p-3",
                COLUMN_ACCENT[status] ?? "border-t-primary/30",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-label font-bold uppercase text-foreground">{status}</h3>
                <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-foreground">
                  {columnLeads.length}
                </span>
              </div>

              <div className="flex min-h-[80px] flex-col gap-2">
                {columnLeads.map((lead, cardIndex) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={cardIndex}
                    onDragStart={setDraggingId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <LostReasonDialog
        leadId={lostDialogLeadId}
        onClose={() => setLostDialogLeadId(null)}
        onConfirm={confirmLostReason}
      />
    </>
  );
}
