"use client";

import { Calendar, Check, Copy, Loader2, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createOrRotateCalendarFeedToken, revokeCalendarFeedToken } from "@/lib/actions/calendar-feed";
import { calendarFeedUrls } from "@/lib/integrations/calendar-feed";
import { formatDateTime } from "@/lib/utils/format";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex.: contexto sem HTTPS) — o campo continua selecionável.
    }
  }

  return (
    <Button variant="outline" size="icon-sm" aria-label="Copiar link" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

/**
 * Feed de calendário — a única integração do catálogo que é real hoje.
 * O usuário assina a URL uma vez no Google/Outlook/Apple Calendar e o
 * app dele consulta sozinho; cada consulta gera uma linha honesta no
 * histórico de sincronização desta integração.
 */
export function CalendarFeedSection({
  token,
  lastAccessedAt,
  origin,
}: {
  token: string | null;
  lastAccessedAt: string | null;
  origin: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();
  const [revoking, startRevoke] = useTransition();

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      try {
        await createOrRotateCalendarFeedToken();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível gerar o link.");
      }
    });
  }

  function handleRevoke() {
    setError(null);
    startRevoke(async () => {
      try {
        await revokeCalendarFeedToken();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível revogar o link.");
      }
    });
  }

  const urls = token ? calendarFeedUrls(origin, token) : null;

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Assinatura pessoal
            </p>
            <h3 className="mt-0.5 text-h2 font-bold text-foreground">Minha agenda de tarefas</h3>
          </div>
        </div>
        {!token ? (
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
            Gerar link de assinatura
          </Button>
        ) : null}
      </div>

      <p className="mt-2 text-body-sm text-card-beige-muted-foreground">
        Cole o link no seu app de calendário (Google Calendar, Outlook ou Apple Calendar →
        &ldquo;Adicionar calendário por URL&rdquo;). Suas tarefas com prazo aparecem lá
        automaticamente e se atualizam sozinhas — o link é pessoal e só mostra as tarefas atribuídas
        a você.
      </p>

      {token && urls ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Link para colar (https)
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={urls.httpsUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full min-w-0 truncate rounded-lg border border-input bg-card px-3 py-2 text-body-sm text-foreground"
              />
              <CopyButton value={urls.httpsUrl} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Assinatura direta (webcal)
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={urls.webcalUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full min-w-0 truncate rounded-lg border border-input bg-card px-3 py-2 text-body-sm text-foreground"
              />
              <CopyButton value={urls.webcalUrl} />
            </div>
          </div>

          <p className="text-caption text-card-beige-muted-foreground">
            {lastAccessedAt
              ? `Última consulta pelo seu app de calendário: ${formatDateTime(lastAccessedAt)}.`
              : "Ainda não consultado por nenhum app de calendário."}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Renovar link
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={revoking}>
              {revoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Revogar
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
