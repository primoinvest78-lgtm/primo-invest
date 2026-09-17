"use client";

import { Loader2, Plug, Power, PowerOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfigureDialog } from "@/components/integrations/detail/configure-dialog";
import { Button } from "@/components/ui/button";
import {
  activateIntegration,
  deactivateIntegration,
  syncIntegrationNow,
  testIntegrationConnection,
} from "@/lib/actions/integrations";
import type { IntegrationRow } from "@/lib/data/integrations";

export function DetailActions({
  integration,
  responsibleOptions,
}: {
  integration: IntegrationRow;
  responsibleOptions: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, startTest] = useTransition();
  const [syncing, startSync] = useTransition();
  const [toggling, startToggle] = useTransition();

  function handleTest() {
    setMessage(null);
    setError(null);
    startTest(async () => {
      try {
        const result = await testIntegrationConnection(integration.id);
        setMessage(result.message);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível testar a conexão.");
      }
    });
  }

  function handleSync() {
    setMessage(null);
    setError(null);
    startSync(async () => {
      try {
        const result = await syncIntegrationNow(integration.id);
        setMessage(result.message);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível sincronizar.");
      }
    });
  }

  function handleToggle() {
    setMessage(null);
    setError(null);
    startToggle(async () => {
      try {
        if (integration.status === "active") {
          await deactivateIntegration(integration.id);
        } else {
          await activateIntegration(integration.id);
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível alterar o status.");
      }
    });
  }

  return (
    <section className="card-premium rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Ações</p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Testar e sincronizar registram uma execução real no histórico — honesta sobre não haver
            conector implementado ainda, nunca um resultado fabricado.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ConfigureDialog integration={integration} responsibleOptions={responsibleOptions} />

          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
            Testar conexão
          </Button>

          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sincronizar agora
          </Button>

          <Button
            variant={integration.status === "active" ? "destructive" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : integration.status === "active" ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            {integration.status === "active" ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-body-sm text-card-beige-muted-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
