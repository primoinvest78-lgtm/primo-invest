import { TasksBoard } from "@/components/tasks/tasks-board";
import { getMyTasks } from "@/lib/data/tasks";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function TarefasPage() {
  const { organizationId, userId } = await requireActiveMembership();
  const tasks = await getMyTasks(organizationId, userId);
  const total = tasks.overdue.length + tasks.today.length + tasks.upcoming.length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-secondary p-5 shadow-panel-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Operação</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Minhas Tarefas
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {total} {total === 1 ? "tarefa pendente" : "tarefas pendentes"} — atrasadas primeiro,
            depois hoje e os próximos dias.
          </p>
        </div>
      </section>

      <TasksBoard tasks={tasks} />
    </div>
  );
}
