"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksFilterBar } from "@/components/tasks/tasks-filter-bar";
import { TasksKpis } from "@/components/tasks/tasks-kpis";
import { TasksPriorityPanel } from "@/components/tasks/tasks-priority-panel";
import { TasksProgress } from "@/components/tasks/tasks-progress";
import type { TaskFormOptions, TaskItem } from "@/lib/data/tasks";
import { applyTaskFilters, DEFAULT_TASK_FILTERS, type TaskFilters } from "@/lib/utils/task-filters";

/** Lê os filtros iniciais da URL (?dueBucket=overdue&category=reuniao) —
 * é assim que cards do Dashboard/Hub CRM chegam aqui já filtrados. */
function filtersFromSearchParams(params: URLSearchParams): TaskFilters {
  const dueBucket = params.get("dueBucket");
  const category = params.get("category");
  return {
    ...DEFAULT_TASK_FILTERS,
    dueBucket: (["overdue", "today", "upcoming", "completed"].includes(dueBucket ?? "")
      ? dueBucket
      : DEFAULT_TASK_FILTERS.dueBucket) as TaskFilters["dueBucket"],
    category: category ?? DEFAULT_TASK_FILTERS.category,
  };
}

export function TasksView({ tasks, options }: { tasks: TaskItem[]; options: TaskFormOptions }) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TaskFilters>(() => filtersFromSearchParams(searchParams));

  const filteredTasks = useMemo(() => applyTaskFilters(tasks, filters), [tasks, filters]);

  return (
    <div className="space-y-5">
      <TasksKpis
        tasks={filteredTasks}
        onSelectBucket={(bucket) => setFilters((f) => ({ ...f, dueBucket: bucket }))}
      />

      <TasksPriorityPanel tasks={filteredTasks} />

      <TasksProgress tasks={filteredTasks} />

      <TasksFilterBar tasks={tasks} filters={filters} onChange={setFilters} />

      <TasksBoard tasks={filteredTasks} options={options} />
    </div>
  );
}
