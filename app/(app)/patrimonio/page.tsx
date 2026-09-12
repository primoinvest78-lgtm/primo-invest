import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function PatrimonioPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Visão geral"
      subtitle="Estrutura patrimonial consolidada"
      context="Visão executiva do patrimônio, composição e evolução do portfólio sob gestão."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Ativo total</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 48,75 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Liquidez</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">18%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Rendimento</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">+8,42%</h2>
      </div>
    </ExecutivePage>
  );
}
