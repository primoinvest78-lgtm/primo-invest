import Link from "next/link";

import type { TaskItem } from "@/lib/data/tasks";
import { formatDate } from "@/lib/utils/format";

export function BidsNextActions({ tasks }: { tasks: TaskItem[] }) {
  const open = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled" && t.consortiumContractId);

  if (open.length === 0) return null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-4 text-h2 font-bold text-foreground">Próximas ações</h3>
      <div className="space-y-2">
        {open.slice(0, 8).map((task) => (
          <Link
            key={task.id}
            href={task.consortiumContractId ? `/consorcios/contratos/${task.consortiumContractId}` : "/tarefas"}
            className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-2.5 text-sm transition-colors duration-150 hover:bg-black/10"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{task.title}</p>
              <p className="text-xs text-card-beige-muted-foreground">
                {task.consortiumContractLabel ?? "—"}
                {task.clientName ? ` · ${task.clientName}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-card-beige-muted-foreground">
              {task.dueAt ? formatDate(task.dueAt) : "Sem prazo"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
