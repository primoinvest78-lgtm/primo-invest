import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function DocumentosListaPage() {
  return (
    <ExecutivePage
      badge="Documentos"
      title="Documentos"
      subtitle="Fluxo documental e assinaturas"
      context="Gerenciamento de documentos por cliente, operação, contrato e gestão patrimonial."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Aguardando assinatura</p>
        <h2 className="mt-3 text-3xl font-bold text-white">3</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Vencimentos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">8</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Validados</p>
        <h2 className="mt-3 text-3xl font-bold text-white">94%</h2>
      </div>
    </ExecutivePage>
  );
}
