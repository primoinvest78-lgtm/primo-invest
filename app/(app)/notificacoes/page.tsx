import { NotificationCenter } from "@/components/notifications/notification-center";
import { listNotifications } from "@/lib/data/notifications";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function NotificacoesPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const filter = filtro === "nao-lidas" ? "nao-lidas" : "todas";
  const { userId } = await requireActiveMembership();
  const items = await listNotifications(userId, filter);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:p-6">
        <p className="text-label font-bold uppercase text-primary">Primo Invest</p>
        <h1 className="text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">Notificações</h1>
        <p className="max-w-3xl text-body text-secondary-foreground/75">
          Avisos internos sobre o que depende de você: tarefas, leads e oportunidades atribuídos, documentos, pagamentos em
          revisão e as etapas de consórcio que aguardam aprovação. Clique em um aviso para ir direto ao que precisa ser feito.
        </p>
      </section>
      <NotificationCenter items={items} filter={filter} />
    </div>
  );
}
