"use client";

import { Loader2, Share2, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { revokeShare, shareReport } from "@/lib/actions/reports";
import type { ReportDetail } from "@/lib/data/reports";
import { SHARE_AUDIENCE_LABEL, SHARE_AUDIENCES, type ShareAudience } from "@/lib/reports/types";
import { formatDateTime } from "@/lib/utils/format";

/**
 * Compartilhamento com registro.
 *
 * Relatório financeiro NUNCA vira link público: não existe token
 * anônimo aqui. Compartilhar registra com quem, por quem e quando — o
 * acesso ao documento continua exigindo ser membro ativo da organização
 * (RLS). O que este diálogo cria é a trilha de auditoria: quem foi
 * autorizado a receber o documento, e se pode baixá-lo.
 */
export function ShareDialog({ report }: { report: ReportDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<ShareAudience>("advisor");
  const [name, setName] = useState("");
  const [canDownload, setCanDownload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [revoking, startRevoke] = useTransition();

  function handleShare() {
    setError(null);
    startSave(async () => {
      try {
        await shareReport({
          reportId: report.id,
          audience,
          sharedWithName: name,
          canDownload,
        });
        setName("");
        setCanDownload(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível compartilhar.");
      }
    });
  }

  function handleRevoke(shareId: string) {
    setError(null);
    startRevoke(async () => {
      try {
        await revokeShare(shareId, report.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível revogar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 className="h-3.5 w-3.5" />
        Compartilhar
        {report.shares.length > 0 ? (
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
            {report.shares.length}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar relatório</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Destinatário
              </label>
              <Select
                value={audience}
                onValueChange={(v) => setAudience((v as ShareAudience) ?? "advisor")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHARE_AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {SHARE_AUDIENCE_LABEL[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Nome / identificação
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Ana Ribeiro"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/50">
            <input
              type="checkbox"
              checked={canDownload}
              onChange={(e) => setCanDownload(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="min-w-0">
              <span className="block text-body-sm font-semibold text-foreground">
                Autorizado a baixar o documento
              </span>
              <span className="block text-caption text-card-beige-muted-foreground">
                Registra que este destinatário pode levar o PDF para fora da plataforma.
              </span>
            </span>
          </label>

          {report.shares.length > 0 ? (
            <div>
              <p className="mb-2 text-label font-bold uppercase text-card-beige-muted-foreground">
                Compartilhamentos registrados
              </p>
              <ul className="space-y-2">
                {report.shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body-sm font-semibold text-foreground">
                        {share.sharedWithName ?? SHARE_AUDIENCE_LABEL[share.audience]}
                        {share.canDownload ? " · pode baixar" : ""}
                      </span>
                      <span className="block text-caption text-card-beige-muted-foreground">
                        {SHARE_AUDIENCE_LABEL[share.audience]} · por{" "}
                        {share.createdByName ?? "—"} em {formatDateTime(share.createdAt)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Revogar compartilhamento"
                      onClick={() => handleRevoke(share.id)}
                      disabled={revoking}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-caption text-card-beige-muted-foreground">
            O relatório não é publicado. Só membros ativos desta organização conseguem abri-lo — o
            registro acima existe para auditoria de quem foi autorizado a recebê-lo.
          </p>

          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleShare} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Registrando..." : "Registrar compartilhamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
