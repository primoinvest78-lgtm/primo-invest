import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function LeadsPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Leads"
      subtitle="Pipeline de prospecção e qualificação"
      context="Monitoramento dos leads em estágio inicial até chegada à proposta e avaliação comercial."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Em qualificação</p>
        <h2 className="mt-3 text-3xl font-bold text-white">32</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Conversão</p>
        <h2 className="mt-3 text-3xl font-bold text-white">22,8%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Tempo médio</p>
        <h2 className="mt-3 text-3xl font-bold text-white">12 dias</h2>
      </div>
    </ExecutivePage>
  );
}
