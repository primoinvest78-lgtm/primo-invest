import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function PassivosPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Passivos"
      subtitle="Estrutura de endividamento e compromissos"
      context="Visão estruturada dos passivos, vencimentos e impacto financeiro sobre o patrimônio."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Passivo total</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 6,1 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Vencimentos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">14</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Cobertura</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">2,8x</h2>
      </div>
    </ExecutivePage>
  );
}
