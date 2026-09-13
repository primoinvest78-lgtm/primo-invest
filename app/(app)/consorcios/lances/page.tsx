import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function LancesPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Lances"
      subtitle="Gestão de lances e competitividade"
      context="Acompanhamento dos lances em disputa e evolução do processo de aquisição."
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Lances ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">7</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Maior lance</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 1,4 mi</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Estratégia</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Agresiva</h2>
      </div>
    </ExecutivePage>
  );
}
