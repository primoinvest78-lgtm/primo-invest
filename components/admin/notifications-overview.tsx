import { Bell } from "lucide-react";
import Link from "next/link";

/**
 * Notificações internas ativas: geradas por gatilhos no banco (tarefas,
 * leads e oportunidades atribuídos; documentos; pagamentos em revisão;
 * etapas de consórcio que aguardam governança) e pelo resumo pessoal
 * do dia. Canais externos (e-mail, push) ainda não existem.
 */
export function NotificationsOverview({ totalNotifications }: { totalNotifications: number }) {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Configurações</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Notificações</h3>
        </div>
      </div>

      <p className="mt-3 text-body-sm text-card-beige-muted-foreground">
        Notificações internas ativas — {totalNotifications} para você até agora. Cada pessoa recebe no sino
        do cabeçalho os avisos do que depende dela, em tempo real.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-caption text-card-beige-muted-foreground">
        <li>Tarefa, lead ou oportunidade atribuído a você.</li>
        <li>Documento solicitado recebido, aprovado ou reprovado; documento sob sua responsabilidade.</li>
        <li>Pagamento aguardando revisão ou com exceção (financeiro e operações).</li>
        <li>Consórcios: regra aguardando aprovação, resultado oficial a verificar, assembleia a homologar, retificação, crédito em análise e anomalias críticas (governança).</li>
        <li>Resumo do dia: suas tarefas atrasadas e as que vencem hoje.</li>
      </ul>
      <p className="mt-2 text-caption text-card-beige-muted-foreground">
        Envio por e-mail ainda não está disponível.{" "}
        <Link href="/notificacoes" className="font-semibold text-accent hover:underline">
          Abrir minhas notificações
        </Link>
      </p>
    </section>
  );
}
