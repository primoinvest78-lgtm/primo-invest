"use client";

import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { completeTask, deleteTask } from "@/lib/actions/tasks";
import type { TaskFormOptions, TaskItem } from "@/lib/data/tasks";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import {
  CATEGORY_LABEL,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABEL,
  STATUS_LABEL,
  classifyTaskBucket,
  taskLinkedHref,
  taskLinkedLabel,
  taskOrigin,
} from "@/lib/utils/task-helpers";

function TaskRow({
  task,
  options,
  onRemove,
}: {
  task: TaskItem;
  options: TaskFormOptions;
  onRemove: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const href = taskLinkedHref(task);
  const linkedLabel = taskLinkedLabel(task);
  const isCompleted = task.status === "completed";

  async function handleComplete() {
    setBusy(true);
    await completeTask(task.id, {
      clientId: task.clientId ?? undefined,
      opportunityId: task.opportunityId ?? undefined,
      leadId: task.leadId ?? undefined,
    });
    onRemove(task.id);
  }

  async function handleDelete() {
    setBusy(true);
    await deleteTask(task.id, {
      clientId: task.clientId ?? undefined,
      opportunityId: task.opportunityId ?? undefined,
      leadId: task.leadId ?? undefined,
    });
    onRemove(task.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: busy ? 0 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
    >
      <div className="flex items-start gap-3">
        {!isCompleted ? (
          <button
            type="button"
            onClick={handleComplete}
            disabled={busy}
            aria-label="Marcar como concluída"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/50 text-transparent transition-colors duration-150 hover:border-primary hover:bg-primary/15 hover:text-primary"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        ) : (
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-primary">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={[
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                  PRIORITY_BADGE_CLASS[task.priority] ?? PRIORITY_BADGE_CLASS.normal,
                ].join(" ")}
              >
                {PRIORITY_LABEL[task.priority] ?? task.priority}
              </span>
              <TaskEditDialog task={task} options={options} />
              <button
                type="button"
                aria-label="Excluir tarefa"
                onClick={handleDelete}
                disabled={busy}
                className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-card-beige-muted-foreground">
            {task.dueAt ? <span>{formatDateTime(task.dueAt)}</span> : <span>Sem prazo</span>}
            {href && linkedLabel ? (
              <Link href={href} className="font-semibold text-accent hover:underline">
                {linkedLabel}
              </Link>
            ) : null}
            {task.assignedToName ? <span>Resp.: {task.assignedToName}</span> : null}
            <Badge variant="outline" className="text-[10px]">
              {taskOrigin(task)}
            </Badge>
            {task.category ? (
              <Badge variant="outline" className="text-[10px]">
                {CATEGORY_LABEL[task.category] ?? task.category}
              </Badge>
            ) : null}
            {isCompleted ? (
              <span className="font-semibold text-primary">
                {STATUS_LABEL.completed}
                {task.completedAt ? ` · ${formatDate(task.completedAt)}` : ""}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TaskGroup({
  title,
  tasks,
  options,
  onRemove,
  accent,
  delay = 0,
}: {
  title: string;
  tasks: TaskItem[];
  options: TaskFormOptions;
  onRemove: (id: string) => void;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="card-premium rounded-2xl p-5 md:p-6"
    >
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
            <TaskRow key={task.id} task={task} options={options} onRemove={onRemove} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function TasksBoard({ tasks, options }: { tasks: TaskItem[]; options: TaskFormOptions }) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [prevTasks, setPrevTasks] = useState(tasks);

  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setRemovedIds(new Set());
  }

  const visible = tasks.filter((t) => !removedIds.has(t.id));

  function handleRemove(id: string) {
    setRemovedIds((current) => new Set(current).add(id));
  }

  const buckets = {
    overdue: visible.filter((t) => classifyTaskBucket(t) === "overdue"),
    today: visible.filter((t) => classifyTaskBucket(t) === "today"),
    upcoming: visible.filter((t) => classifyTaskBucket(t) === "upcoming"),
    completed: visible.filter((t) => classifyTaskBucket(t) === "completed"),
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
      <TaskGroup
        title="Atrasadas"
        tasks={buckets.overdue}
        options={options}
        onRemove={handleRemove}
        accent="text-destructive"
        delay={0}
      />
      <TaskGroup
        title="Hoje"
        tasks={buckets.today}
        options={options}
        onRemove={handleRemove}
        delay={0.06}
      />
      <TaskGroup
        title="Próximas"
        tasks={buckets.upcoming}
        options={options}
        onRemove={handleRemove}
        delay={0.12}
      />
      <TaskGroup
        title="Concluídas"
        tasks={buckets.completed}
        options={options}
        onRemove={handleRemove}
        accent="text-primary"
        delay={0.18}
      />
    </div>
  );
}
