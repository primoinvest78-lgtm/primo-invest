"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import type { TaskItem } from "@/lib/data/tasks";
import { formatDateTime } from "@/lib/utils/format";
import {
  classifyTaskBucket,
  computeTaskPriorityScore,
  isTaskOpen,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABEL,
  taskLinkedHref,
  taskLinkedLabel,
} from "@/lib/utils/task-helpers";

const MAX_VISIBLE = 8;

function reasonsFor(task: TaskItem): string[] {
  const reasons: string[] = [];
  const bucket = classifyTaskBucket(task);
  if (bucket === "overdue") reasons.push("Atrasada");
  if (task.priority === "high" || task.priority === "urgent") reasons.push("Alta prioridade");
  if (task.clientId) reasons.push("Cliente");
  if (bucket === "today") reasons.push("Vence hoje");
  else if (task.dueAt) {
    const daysUntil = (new Date(task.dueAt).getTime() - Date.now()) / 86_400_000;
    if (daysUntil > 0 && daysUntil <= 3) reasons.push("Vence em breve");
  }
  if (task.opportunityId) reasons.push("Oportunidade");
  return reasons;
}

export function TasksPriorityPanel({ tasks }: { tasks: TaskItem[] }) {
  const ranked = useMemo(() => {
    return tasks
      .filter((t) => isTaskOpen(t.status))
      .map((t) => ({ task: t, score: computeTaskPriorityScore(t) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_VISIBLE);
  }, [tasks]);

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Ação</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Prioridade de hoje</h3>
      </div>

      {ranked.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma tarefa aberta no momento.
        </p>
      ) : (
        <div className="space-y-2">
          {ranked.map(({ task }, index) => {
            const href = taskLinkedHref(task);
            const linkedLabel = taskLinkedLabel(task);
            const reasons = reasonsFor(task);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {task.dueAt ? (
                      <span className="text-xs font-medium text-card-beige-muted-foreground">
                        {formatDateTime(task.dueAt)}
                      </span>
                    ) : null}
                    {href && linkedLabel ? (
                      <Link href={href} className="text-xs font-semibold text-accent hover:underline">
                        {linkedLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                      PRIORITY_BADGE_CLASS[task.priority] ?? PRIORITY_BADGE_CLASS.normal,
                    ].join(" ")}
                  >
                    {PRIORITY_LABEL[task.priority] ?? task.priority}
                  </span>
                  {reasons.map((reason) => (
                    <Badge key={reason} variant="outline" className="text-[10px]">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
