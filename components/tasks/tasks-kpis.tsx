"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { TaskItem } from "@/lib/data/tasks";
import { classifyTaskBucket, isTaskOpen } from "@/lib/utils/task-helpers";

function Kpi({
  label,
  value,
  valueClassName,
  index,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-premium rounded-2xl p-4 transition-all duration-200"
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
    </motion.div>
  );
}

export function TasksKpis({ tasks }: { tasks: TaskItem[] }) {
  const overdue = tasks.filter((t) => classifyTaskBucket(t) === "overdue").length;
  const today = tasks.filter((t) => classifyTaskBucket(t) === "today").length;
  const upcoming = tasks.filter((t) => classifyTaskBucket(t) === "upcoming").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const totalOpen = tasks.filter((t) => isTaskOpen(t.status)).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Kpi label="Atrasadas" value={String(overdue)} valueClassName="text-destructive" index={0} />
      <Kpi label="Hoje" value={String(today)} valueClassName="text-warning" index={1} />
      <Kpi label="Próximos dias" value={String(upcoming)} index={2} />
      <Kpi label="Concluídas" value={String(completed)} valueClassName="text-primary" index={3} />
      <Kpi label="Total abertas" value={String(totalOpen)} index={4} />
    </div>
  );
}
