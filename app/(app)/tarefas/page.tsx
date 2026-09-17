import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { ReportShortcutButton } from "@/components/reports/report-shortcut-button";
import { TasksView } from "@/components/tasks/tasks-view";
import { getTaskFormOptions, listTasks } from "@/lib/data/tasks";
import { requireActiveMembership } from "@/lib/supabase/session";
import { isTaskOpen } from "@/lib/utils/task-helpers";

export default async function TarefasPage() {
  const { organizationId } = await requireActiveMembership();
  const [tasks, options] = await Promise.all([
    listTasks(organizationId),
    getTaskFormOptions(organizationId),
  ]);
  const totalOpen = tasks.filter((t) => isTaskOpen(t.status)).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Operação</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Tarefas
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {totalOpen} {totalOpen === 1 ? "tarefa aberta" : "tarefas abertas"} — atrasadas primeiro,
            depois hoje e os próximos dias.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ReportShortcutButton type="operacional" label="Relatório operacional" />
          <TaskCreateDialog options={options} />
        </div>
      </section>

      <TasksView tasks={tasks} options={options} />
    </div>
  );
}
