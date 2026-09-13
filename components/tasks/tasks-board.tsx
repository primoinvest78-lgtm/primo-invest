"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { completeTask } from "@/lib/actions/tasks";
import type { MyTasks, TaskItem } from "@/lib/data/tasks";
import { formatDateTime } from "@/lib/utils/format";

const PRIORITY_STYLE: Record<string, string> = {
  urgent: "border-destructive/40 bg-destructive/10 text-destructive",
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  normal: "border-primary/40 bg-primary/10 text-foreground",
  low: "border-black/10 bg-black/5 text-card-beige-muted-foreground",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

function TaskRow({ task, onComplete }: { task: TaskItem; onComplete: (id: string) => void }) {
  const [completing, setCompleting] = useState(false);
  const linkHref = task.clientId
    ? `/clientes/${task.clientId}`
    : task.opportunityId
      ? `/oportunidades/${task.opportunityId}`
      : task.leadId
        ? `/leads/${task.leadId}`
        : null;
  const linkLabel = task.clientName ?? task.opportunityTitle ?? task.leadName;

  async function handleComplete() {
    setCompleting(true);
    await completeTask(task.id);
    onComplete(task.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: completing ? 0 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:bg-black/10"
    >
      <button
        type="button"
        onClick={handleComplete}
        disabled={completing}
        aria-label="Marcar como concluída"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/50 text-transparent transition-colors duration-150 hover:border-primary hover:bg-primary/15 hover:text-primary"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-card-beige-muted-foreground">
          {task.dueAt ? <span>{formatDateTime(task.dueAt)}</span> : null}
          {linkHref && linkLabel ? (
            <Link href={linkHref} className="font-medium text-accent hover:underline">
              {linkLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <span
        className={[
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
          PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.normal,
        ].join(" ")}
      >
        {PRIORITY_LABEL[task.priority] ?? task.priority}
      </span>
    </motion.div>
  );
}

function TaskGroup({
  title,
  tasks,
  onComplete,
  accent,
}: {
  title: string;
  tasks: TaskItem[];
  onComplete: (id: string) => void;
  accent?: string;
}) {
  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className={["text-h2 font-bold", accent ?? "text-foreground"].join(" ")}>{title}</h3>
        <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-foreground">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">Nada por aqui.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onComplete={onComplete} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TasksBoard({ tasks }: { tasks: MyTasks }) {
  const [state, setState] = useState(tasks);

  function handleComplete(id: string) {
    setState((current) => ({
      overdue: current.overdue.filter((t) => t.id !== id),
      today: current.today.filter((t) => t.id !== id),
      upcoming: current.upcoming.filter((t) => t.id !== id),
    }));
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <TaskGroup
        title="Atrasadas"
        tasks={state.overdue}
        onComplete={handleComplete}
        accent="text-destructive"
      />
      <TaskGroup title="Hoje" tasks={state.today} onComplete={handleComplete} />
      <TaskGroup title="Próximos dias" tasks={state.upcoming} onComplete={handleComplete} />
    </div>
  );
}
