import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function TarefasPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Tarefas"
      subtitle="Operação e execução de atividades prioritárias"
      context="Monitoramento de ações pendentes, prazos e carga operacional do time executivo."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Pendentes</p>
        <h2 className="mt-3 text-3xl font-bold text-white">26</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Em atraso</p>
        <h2 className="mt-3 text-3xl font-bold text-white">2</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Concluídas</p>
        <h2 className="mt-3 text-3xl font-bold text-white">91%</h2>
      </div>
    </ExecutivePage>
  );
}
