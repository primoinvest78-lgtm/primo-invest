import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ParcelasPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Parcelas"
      subtitle="Fluxo de pagamentos e vencimentos"
      context="Gestão de parcelas ativas, vencimentos e acompanhamento do fluxo de quitação."
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Em aberto</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">96</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">This month</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 0,8 mi</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Em dia</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">91%</h2>
      </div>
    </ExecutivePage>
  );
}
