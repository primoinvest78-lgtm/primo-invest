import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function AdministracaoPage() {
  return (
    <ExecutivePage
      badge="Administração"
      title="Administração"
      subtitle="Operação, governança e controles internos"
      context="Área institucional para controle operacional, políticas, governança e alinhamento executivo."
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Controles</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">27</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Governança</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">100%</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Status</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Em dia</h2>
      </div>
    </ExecutivePage>
  );
}
