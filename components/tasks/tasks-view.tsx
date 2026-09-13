"use client";

import { useMemo, useState } from "react";

import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksFilterBar } from "@/components/tasks/tasks-filter-bar";
import { TasksKpis } from "@/components/tasks/tasks-kpis";
import { TasksPriorityPanel } from "@/components/tasks/tasks-priority-panel";
import { TasksProgress } from "@/components/tasks/tasks-progress";
import type { TaskFormOptions, TaskItem } from "@/lib/data/tasks";
import { applyTaskFilters, DEFAULT_TASK_FILTERS, type TaskFilters } from "@/lib/utils/task-filters";

export function TasksView({ tasks, options }: { tasks: TaskItem[]; options: TaskFormOptions }) {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_TASK_FILTERS);

  const filteredTasks = useMemo(() => applyTaskFilters(tasks, filters), [tasks, filters]);

  return (
    <div className="space-y-5">
      <TasksKpis tasks={filteredTasks} />

      <TasksPriorityPanel tasks={filteredTasks} />

      <TasksProgress tasks={filteredTasks} />

      <TasksFilterBar tasks={tasks} filters={filters} onChange={setFilters} />

      <TasksBoard tasks={filteredTasks} options={options} />
    </div>
  );
}
