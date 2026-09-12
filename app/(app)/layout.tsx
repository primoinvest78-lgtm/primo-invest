import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  // Garante sessão + organização ativa antes de renderizar qualquer rota
  // autenticada (o middleware já redireciona sem sessão, isso é defesa em
  // profundidade e falha cedo se o usuário não tiver organization_member).
  await requireActiveMembership();

  return <AppShell>{children}</AppShell>;
}
