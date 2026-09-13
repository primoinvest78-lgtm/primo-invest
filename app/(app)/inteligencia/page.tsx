import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function InteligenciaPage() {
  return (
    <ExecutivePage
      badge="Inteligência"
      title="Inteligência"
      subtitle="Insights e sinais de mercado"
      context="Painel executivo de indicadores, inteligência estratégica e leitura de oportunidades em tempo real."
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Sinais ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">14</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Indicadores</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">92%</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Foco</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Patrimônio</h2>
      </div>
    </ExecutivePage>
  );
}
