import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function TarefasPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Tarefas"
      subtitle="Operação e execução de atividades prioritárias"
      context="Monitoramento de ações pendentes, prazos e carga operacional do time executivo."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Pendentes</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">26</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Em atraso</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">2</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Concluídas</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">91%</h2>
      </div>
    </ExecutivePage>
  );
}
