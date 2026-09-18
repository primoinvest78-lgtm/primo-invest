"use client";

import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "primo-invest-cookie-consent";

/**
 * Aviso de cookies (LGPD). O app usa só cookies essenciais — sessão de
 * autenticação do Supabase — nenhum cookie de analytics/marketing.
 * Por isso não há central de preferências por categoria: seria
 * inventar uma escolha que não existe de verdade.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Só dá pra ler localStorage depois de montar no cliente — decidir
    // isso já no primeiro render (SSR) quebraria a hidratação, já que
    // o servidor nunca tem acesso a esse storage.
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // localStorage indisponível (ex.: navegação privada) — não bloqueia a página.
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "aceito");
    } catch {
      // Sem storage disponível, só fecha o aviso pra essa visita.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
    >
      <div className="flex w-full max-w-2xl flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Cookie className="h-4 w-4" />
        </div>

        <p className="flex-1 text-body-sm text-muted-foreground">
          Usamos apenas cookies essenciais — necessários para manter sua sessão conectada e
          proteger o acesso à plataforma. Não usamos cookies de rastreamento ou publicidade. Ao
          continuar navegando, você concorda com o uso desses cookies essenciais.
        </p>

        <Button size="sm" onClick={accept} className="w-full shrink-0 sm:w-auto">
          Entendi
        </Button>
      </div>
    </div>
  );
}
