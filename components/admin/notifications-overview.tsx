import { Bell } from "lucide-react";

/**
 * A tabela `notifications` existe no banco (preparada pra guardar
 * notificações por usuário), mas está vazia hoje — nada na plataforma
 * ainda grava ou envia notificação nenhuma. Mostrar isso honestamente
 * em vez de simular canais/preferências que não têm efeito nenhum.
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
        A estrutura para notificações por usuário já existe no banco, mas nenhum módulo envia
        notificações ainda — {totalNotifications === 0 ? "por isso o total registrado é zero." : `${totalNotifications} registradas até agora.`}
      </p>
      <p className="mt-2 text-caption text-card-beige-muted-foreground">
        Preferências de canal (e-mail, push, dentro do app) ficam disponíveis aqui assim que houver um
        módulo real gerando notificações.
      </p>
    </section>
  );
}
