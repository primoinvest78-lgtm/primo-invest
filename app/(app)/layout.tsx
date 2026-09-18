import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { requireActiveMembership } from "@/lib/supabase/session";

// Rotas autenticadas dependem de sessão/cookies por requisição e nunca devem
// ser pré-renderizadas em build: sem isso o Next tenta gerar página estática
// e falha (o erro de env ausente acontece antes de qualquer chamada a
// cookies(), então o Next não detecta a rota como dinâmica sozinho).
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  // Garante sessão + organização ativa antes de renderizar qualquer rota
  // autenticada (o middleware já redireciona sem sessão, isso é defesa em
  // profundidade e falha cedo se o usuário não tiver organization_member).
  const { fullName, email, role } = await requireActiveMembership();

  return (
    <AppShell user={{ fullName, email, role }}>{children}</AppShell>
  );
}
