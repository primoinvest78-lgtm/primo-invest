import type { TaskItem } from "@/lib/data/tasks";

export type TaskFilters = {
  advisorId: string;
  clientId: string;
  priority: string;
  status: string;
  category: string;
  dueFrom: string;
  dueTo: string;
};

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  advisorId: "all",
  clientId: "all",
  priority: "all",
  status: "all",
  category: "all",
  dueFrom: "",
  dueTo: "",
};

export function hasActiveTaskFilters(filters: TaskFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "dueFrom" || key === "dueTo") return value !== "";
    return value !== "all";
  });
}

export function applyTaskFilters(tasks: TaskItem[], filters: TaskFilters): TaskItem[] {
  return tasks.filter((task) => {
    if (filters.advisorId !== "all") {
      if (filters.advisorId === "none" ? task.assignedToId !== null : task.assignedToId !== filters.advisorId) {
        return false;
      }
    }

    if (filters.clientId !== "all" && task.clientId !== filters.clientId) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.status !== "all" && task.status !== filters.status) return false;

    if (filters.category !== "all") {
      if (filters.category === "none" ? task.category !== null : task.category !== filters.category) {
        return false;
      }
    }

    if (filters.dueFrom !== "" && (!task.dueAt || task.dueAt.slice(0, 10) < filters.dueFrom)) return false;
    if (filters.dueTo !== "" && (!task.dueAt || task.dueAt.slice(0, 10) > filters.dueTo)) return false;

    return true;
  });
}
