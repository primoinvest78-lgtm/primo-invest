"use client";

import { X } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskItem } from "@/lib/data/tasks";
import { DEFAULT_TASK_FILTERS, hasActiveTaskFilters, type TaskFilters } from "@/lib/utils/task-filters";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL, TASK_CATEGORIES } from "@/lib/utils/task-helpers";

export function TasksFilterBar({
  tasks,
  filters,
  onChange,
}: {
  tasks: TaskItem[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}) {
  const advisors = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      if (task.assignedToId) map.set(task.assignedToId, task.assignedToName ?? "—");
    }
    return Array.from(map.entries());
  }, [tasks]);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      if (task.clientId) map.set(task.clientId, task.clientName ?? "—");
    }
    return Array.from(map.entries());
  }, [tasks]);

  function set<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Responsável
        </label>
        <Select value={filters.advisorId} onValueChange={(v) => set("advisorId", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="none">Sem responsável</SelectItem>
            {advisors.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Cliente</label>
        <Select value={filters.clientId} onValueChange={(v) => set("clientId", v ?? "all")}>
          <SelectTrigger className="w-[170px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clients.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Prioridade
        </label>
        <Select value={filters.priority} onValueChange={(v) => set("priority", v ?? "all")}>
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Status</label>
        <Select value={filters.status} onValueChange={(v) => set("status", v ?? "all")}>
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Categoria
        </label>
        <Select value={filters.category} onValueChange={(v) => set("category", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="none">Sem categoria</SelectItem>
            {TASK_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {CATEGORY_LABEL[c.value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Prazo de
        </label>
        <Input
          type="date"
          className="h-7 w-[140px] text-sm"
          value={filters.dueFrom}
          onChange={(e) => set("dueFrom", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Prazo até
        </label>
        <Input
          type="date"
          className="h-7 w-[140px] text-sm"
          value={filters.dueTo}
          onChange={(e) => set("dueTo", e.target.value)}
        />
      </div>

      {hasActiveTaskFilters(filters) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(DEFAULT_TASK_FILTERS)}
          className="gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
