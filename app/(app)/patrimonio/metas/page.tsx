import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function MetasPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Metas patrimoniais"
      subtitle="Evolução de objetivos e planejamento financeiro"
      context="Acompanhamento dos objetivos patrimoniais e avanço em relação à meta de longo prazo."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Reserva de longo prazo</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 2,4 mi / 3,0 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Aposentadoria</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 4,8 mi / 6,0 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Expansão patrimonial</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 7,2 mi / 10,0 mi</h2>
      </div>
    </ExecutivePage>
  );
}
