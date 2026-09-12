import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function InvestimentosPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Investimentos"
      subtitle="Carteira e ativos sob gestão"
      context="Acompanhamento das classes de ativos, concentração e evolução dos investimentos."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Total em gestão</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 41,28 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Renda fixa</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">42%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Ações</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">15%</h2>
      </div>
    </ExecutivePage>
  );
}
