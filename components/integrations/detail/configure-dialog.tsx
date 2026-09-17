"use client";

import { Loader2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { configureIntegration } from "@/lib/actions/integrations";
import type { IntegrationRow } from "@/lib/data/integrations";
import {
  ENVIRONMENT_LABEL,
  ENVIRONMENTS,
  SYNC_FREQUENCIES,
  SYNC_FREQUENCY_LABEL,
  type Environment,
  type SyncFrequency,
} from "@/lib/integrations/catalog";

const NONE = "none";

/**
 * Configuração administrativa — ambiente, frequência pretendida,
 * responsável e o sinalizador de credenciais. Não existe campo de
 * texto pra token/senha/segredo neste formulário: "Credenciais
 * configuradas por fora" é só um sinalizador de governança, nunca o
 * valor da credencial em si.
 */
export function ConfigureDialog({
  integration,
  responsibleOptions,
}: {
  integration: IntegrationRow;
  responsibleOptions: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [environment, setEnvironment] = useState(integration.environment ?? NONE);
  const [frequency, setFrequency] = useState<SyncFrequency>(
    (integration.syncFrequency as SyncFrequency) ?? "manual",
  );
  const [responsibleId, setResponsibleId] = useState(integration.responsibleId ?? NONE);
  const [hasCredentials, setHasCredentials] = useState(integration.hasCredentials);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function handleSubmit() {
    setError(null);
    startSave(async () => {
      try {
        await configureIntegration({
          integrationId: integration.id,
          environment: environment === NONE ? null : environment,
          syncFrequency: frequency,
          responsibleId: responsibleId === NONE ? null : responsibleId,
          hasCredentials,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar a configuração.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Settings className="h-3.5 w-3.5" />
        Configurar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar {integration.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Ambiente
              </label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v ?? NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione">
                    {() => (environment === NONE ? "Não definido" : ENVIRONMENT_LABEL[environment as Environment])}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não definido</SelectItem>
                  {ENVIRONMENTS.map((env) => (
                    <SelectItem key={env} value={env}>
                      {ENVIRONMENT_LABEL[env]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Frequência
              </label>
              <Select value={frequency} onValueChange={(v) => setFrequency((v as SyncFrequency) ?? "manual")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => SYNC_FREQUENCY_LABEL[frequency]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SYNC_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {SYNC_FREQUENCY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Responsável
            </label>
            <Select value={responsibleId} onValueChange={(v) => setResponsibleId(v ?? NONE)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione">
                  {() =>
                    responsibleId === NONE
                      ? "Não definido"
                      : (responsibleOptions.find((r) => r.id === responsibleId)?.fullName ?? "Não definido")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não definido</SelectItem>
                {responsibleOptions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/50">
            <input
              type="checkbox"
              checked={hasCredentials}
              onChange={(e) => setHasCredentials(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span className="min-w-0">
              <span className="block text-body-sm font-semibold text-foreground">
                Credenciais configuradas por fora
              </span>
              <span className="block text-caption text-card-beige-muted-foreground">
                Só um sinalizador de governança — nenhum valor de credencial é digitado ou guardado
                aqui.
              </span>
            </span>
          </label>

          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar configuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
