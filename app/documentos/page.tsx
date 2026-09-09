import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function DocumentosPage() {
  return (
    <ExecutivePage
      badge="Documentos"
      title="Documentos"
      subtitle="Controle documental institucional"
      context="Acompanhamento de documentos, cofre digital e fluxo de assinaturas e validações."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Total</p>
        <h2 className="mt-3 text-3xl font-bold text-white">428</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Pendentes</p>
        <h2 className="mt-3 text-3xl font-bold text-white">3</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Assinaturas</p>
        <h2 className="mt-3 text-3xl font-bold text-white">14</h2>
      </div>
    </ExecutivePage>
  );
}
