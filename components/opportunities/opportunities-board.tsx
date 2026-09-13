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
import { markOpportunityWonLost, updateOpportunityStage } from "@/lib/actions/opportunities";
import type { OpportunityCard, StageColumn } from "@/lib/data/opportunities";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import { effectiveProbability, PRIORITY_BADGE_CLASS, PRIORITY_LABEL } from "@/lib/utils/opportunity-helpers";

const LOSS_REASONS = [
  "Preço",
  "Concorrência",
  "Timing / adiado",
  "Sem orçamento",
  "Perfil não adequado",
  "Outro",
];

function OpportunityMiniCard({
  opp,
  stageProbability,
  index,
  onDragStart,
}: {
  opp: OpportunityCard;
  stageProbability: number | null;
  index: number;
  onDragStart: (id: string) => void;
}) {
  const probability = effectiveProbability(opp, stageProbability);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
      draggable
      onDragStart={() => onDragStart(opp.id)}
      className="cursor-grab rounded-xl border border-black/10 bg-black/5 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:bg-black/10 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/oportunidades/${opp.id}`} className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground hover:text-accent">{opp.title}</p>
        </Link>
        <span
          className={[
            "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
            PRIORITY_BADGE_CLASS[opp.priority] ?? PRIORITY_BADGE_CLASS.normal,
          ].join(" ")}
        >
          {PRIORITY_LABEL[opp.priority] ?? opp.priority}
        </span>
      </div>

      <p className="mt-1 text-xs font-medium uppercase text-card-beige-muted-foreground">
        {opp.clientName ?? opp.leadName ?? "—"}
        {opp.opportunityType ? ` · ${opp.opportunityType}` : ""}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">{formatCurrencyBRL(opp.estimatedValue)}</span>
        {probability !== null ? (
          <span className="text-[11px] font-semibold text-card-beige-muted-foreground">
            {probability}% prob.
          </span>
        ) : null}
      </div>

      {opp.expectedCloseDate ? (
        <p className="mt-1 text-[11px] font-medium text-card-beige-muted-foreground">
          Previsão: {formatDate(opp.expectedCloseDate)}
        </p>
      ) : null}
    </motion.div>
  );
}

function LostReasonDialog({
  pending,
  onClose,
  onConfirm,
}: {
  pending: { opportunityId: string; stageId: string } | null;
  onClose: () => void;
  onConfirm: (opportunityId: string, stageId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState(LOSS_REASONS[0]);

  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Por que essa oportunidade foi perdida?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pending) onConfirm(pending.opportunityId, pending.stageId, reason);
              }}
            >
              Confirmar perda
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OpportunitiesBoard({ stages }: { stages: StageColumn[] }) {
  const [columns, setColumns] = useState(stages);
  const [prevStages, setPrevStages] = useState(stages);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [lostPending, setLostPending] = useState<{ opportunityId: string; stageId: string } | null>(null);

  if (stages !== prevStages) {
    setPrevStages(stages);
    setColumns(stages);
  }

  function moveCard(id: string, fromStageId: string, toStageId: string) {
    setColumns((current) => {
      const from = current.find((c) => c.id === fromStageId);
      const opp = from?.opportunities.find((o) => o.id === id);
      if (!opp) return current;

      return current.map((col) => {
        if (col.id === fromStageId) {
          return { ...col, opportunities: col.opportunities.filter((o) => o.id !== id) };
        }
        if (col.id === toStageId) {
          return { ...col, opportunities: [...col.opportunities, opp] };
        }
        return col;
      });
    });
  }

  function handleDrop(toStageId: string) {
    if (!draggingId) return;
    const id = draggingId;
    setDraggingId(null);

    const fromStage = columns.find((c) => c.opportunities.some((o) => o.id === id));
    if (!fromStage || fromStage.id === toStageId) return;

    const toStage = columns.find((c) => c.id === toStageId);
    if (!toStage) return;

    if (toStage.stageKey === "perdida") {
      setLostPending({ opportunityId: id, stageId: toStageId });
      return;
    }

    moveCard(id, fromStage.id, toStageId);

    if (toStage.stageKey === "ganha") {
      markOpportunityWonLost(id, { outcome: "won", stageId: toStageId }).catch(() => setColumns(stages));
    } else {
      updateOpportunityStage(id, toStageId).catch(() => setColumns(stages));
    }
  }

  function confirmLoss(id: string, stageId: string, reason: string) {
    const fromStage = columns.find((c) => c.opportunities.some((o) => o.id === id));
    setLostPending(null);
    if (fromStage) moveCard(id, fromStage.id, stageId);

    markOpportunityWonLost(id, { outcome: "lost", lossReason: reason, stageId }).catch(() =>
      setColumns(stages),
    );
  }

  if (columns.length === 0) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhum estágio de oportunidade configurado ainda.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((stage) => {
          const total = stage.opportunities.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
              className="card-premium flex w-[290px] shrink-0 flex-col rounded-2xl p-3"
            >
              <div className="mb-1 flex items-center justify-between px-1">
                <h3 className="text-label font-bold uppercase text-foreground">{stage.name}</h3>
                <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-foreground">
                  {stage.opportunities.length}
                </span>
              </div>
              <p className="mb-3 px-1 text-xs font-semibold text-card-beige-muted-foreground">
                {formatCurrencyBRL(total)}
                {stage.probability !== null ? ` · ${stage.probability}% prob.` : ""}
              </p>

              <div className="flex min-h-[80px] flex-col gap-2">
                {stage.opportunities.map((opp, cardIndex) => (
                  <OpportunityMiniCard
                    key={opp.id}
                    opp={opp}
                    stageProbability={stage.probability}
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
        pending={lostPending}
        onClose={() => setLostPending(null)}
        onConfirm={confirmLoss}
      />
    </>
  );
}
