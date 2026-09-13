import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ContratosPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Contratos"
      subtitle="Detalhamento de contratos vigentes"
      context="Acompanhamento de contratos por status, valor e relativa maturidade financeira."
      backHref="/consorcios"
      backLabel="Voltar a Consórcios"
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">12</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Valor total</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 9,2 mi</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Prazo médio</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">38 meses</h2>
      </div>
    </ExecutivePage>
  );
}
