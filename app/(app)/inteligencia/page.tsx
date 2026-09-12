import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function InteligenciaPage() {
  return (
    <ExecutivePage
      badge="Inteligência"
      title="Inteligência"
      subtitle="Insights e sinais de mercado"
      context="Painel executivo de indicadores, inteligência estratégica e leitura de oportunidades em tempo real."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Sinais ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">14</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Indicadores</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">92%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Foco</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Patrimônio</h2>
      </div>
    </ExecutivePage>
  );
}
