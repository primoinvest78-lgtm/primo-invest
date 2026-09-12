import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ContasPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Contas"
      subtitle="Estrutura de contas e alocação operacional"
      context="Centralização das contas e contas vinculadas para gestão de patrimônio e fluxo financeiro."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Contas ativas</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">67</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Disponibilidade</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 2,8 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Consolidação</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">100%</h2>
      </div>
    </ExecutivePage>
  );
}
