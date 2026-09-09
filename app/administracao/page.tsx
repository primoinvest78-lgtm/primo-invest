import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function AdministracaoPage() {
  return (
    <ExecutivePage
      badge="Administração"
      title="Administração"
      subtitle="Operação, governança e controles internos"
      context="Área institucional para controle operacional, políticas, governança e alinhamento executivo."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Controles</p>
        <h2 className="mt-3 text-3xl font-bold text-white">27</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Governança</p>
        <h2 className="mt-3 text-3xl font-bold text-white">100%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Status</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Em dia</h2>
      </div>
    </ExecutivePage>
  );
}
