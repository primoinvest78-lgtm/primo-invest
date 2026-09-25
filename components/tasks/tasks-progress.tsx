"use client";

import { motion } from "motion/react";

import { PanelAction } from "@/components/ui/panel-action";
import type { TaskItem } from "@/lib/data/tasks";

export function TasksProgress({ tasks, onShowCompleted }: { tasks: TaskItem[]; onShowCompleted?: () => void }) {
  const total = tasks.filter((t) => t.status !== "cancelled").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const rate = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
          Taxa de conclusão
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">
            {completed}/{total} · {rate.toFixed(0)}%
          </p>
          {onShowCompleted ? <PanelAction onClick={onShowCompleted}>Ver concluídas</PanelAction> : null}
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </div>
  );
}
