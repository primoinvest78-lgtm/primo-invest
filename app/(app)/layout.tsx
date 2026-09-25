import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { getNotificationSummary, syncPersonalDigest, type AppNotification } from "@/lib/data/notifications";
import { NO_ACTIVE_ORGANIZATION, requireActiveMembership, type ActiveMembership } from "@/lib/supabase/session";

// Rotas autenticadas dependem de sessão/cookies por requisição e nunca devem
// ser pré-renderizadas em build: sem isso o Next tenta gerar página estática
// e falha (o erro de env ausente acontece antes de qualquer chamada a
// cookies(), então o Next não detecta a rota como dinâmica sozinho).
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  // Garante sessão + organização ativa antes de renderizar qualquer rota
  // autenticada (o middleware já redireciona sem sessão, isso é defesa em
  // profundidade e falha cedo se o usuário não tiver organization_member).
  // Conta sem vínculo ativo (ex.: entrou pelo Google sem ter sido
  // liberada) vai para uma tela clara em vez da tela genérica de erro.
  let membership: ActiveMembership;
  try {
    membership = await requireActiveMembership();
  } catch (e) {
    if (e instanceof Error && e.message === NO_ACTIVE_ORGANIZATION) redirect("/sem-acesso");
    throw e;
  }
  const { fullName, email, role, userId, organizationId } = membership;

  // Notificações internas: resumo pessoal do dia + contagem real pro sino.
  // Falha aqui nunca derruba a navegação — o sino só aparece vazio.
  let notifications: { items: AppNotification[]; unread: number } = { items: [], unread: 0 };
  try {
    await syncPersonalDigest(organizationId, userId);
    notifications = await getNotificationSummary(userId);
  } catch {
    notifications = { items: [], unread: 0 };
  }

  return (
    <AppShell user={{ fullName, email, role, userId }} notifications={notifications}>{children}</AppShell>
  );
}
