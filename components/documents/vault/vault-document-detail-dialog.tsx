"use client";

import { Archive, Download, Eye, FileText, Share2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addDocumentVersion,
  fetchVaultDocumentDetail,
  getDocumentSignedUrl,
  logDocumentAccess,
  shareDocument,
  updateDocumentMetadata,
} from "@/lib/actions/documents";
import type { VaultDocumentDetail } from "@/lib/data/documents";
import { createClient } from "@/lib/supabase/client";
import {
  ACCESS_ACTION_LABEL,
  categoryLabel,
  documentStatusLabel,
  DOCUMENT_CATEGORIES,
  formatBytes,
  relationshipTypeLabel,
} from "@/lib/utils/document-helpers";
import { formatDateTime } from "@/lib/utils/format";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function ShareForm({ documentId, onDone }: { documentId: string; onDone: () => void }) {
  const [type, setType] = useState("client");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await shareDocument(documentId, {
      sharedWithType: type,
      sharedWithName: String(form.get("name") ?? ""),
      canView: true,
      canDownload: form.get("canDownload") === "on",
      canEdit: false,
      expiresAt: null,
    });

    setLoading(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-black/10 bg-black/5 p-3">
      <Select value={type} onValueChange={(v) => setType(v ?? "client")}>
        <SelectTrigger className="w-full" size="sm">
          <SelectValue placeholder="Compartilhar com" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="advisor">Outro assessor</SelectItem>
          <SelectItem value="team">Equipe</SelectItem>
          <SelectItem value="client">Cliente</SelectItem>
          <SelectItem value="administrator">Administradora</SelectItem>
          <SelectItem value="third_party">Terceiro autorizado</SelectItem>
        </SelectContent>
      </Select>
      <Input name="name" placeholder="Nome de quem recebe o acesso" required className="h-8 text-sm" />
      <label className="flex items-center gap-2 text-xs text-card-beige-muted-foreground">
        <input type="checkbox" name="canDownload" className="h-3.5 w-3.5" />
        Permitir download
      </label>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Salvando..." : "Confirmar compartilhamento"}
      </Button>
    </form>
  );
}

function DocumentDetailBody({ documentId }: { documentId: string }) {
  const [detail, setDetail] = useState<VaultDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchVaultDocumentDetail(documentId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Falha ao carregar detalhe do documento", err);
        setLoadError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  async function handleView() {
    if (!detail) return;
    const { url } = await getDocumentSignedUrl(detail.versions[0]?.storagePath ?? "", false);
    await logDocumentAccess(detail.id, "view");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    if (!detail) return;
    const { url } = await getDocumentSignedUrl(detail.versions[0]?.storagePath ?? "", true);
    await logDocumentAccess(detail.id, "download");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleArchiveToggle() {
    if (!detail) return;
    await updateDocumentMetadata(detail.id, {
      category: detail.category,
      expiresAt: detail.expiresAt,
      tags: detail.tags,
      status: detail.status === "archived" ? "active" : "archived",
      clientId: detail.clientId,
    });
    const refreshed = await fetchVaultDocumentDetail(detail.id);
    setDetail(refreshed);
  }

  async function handleCategoryChange(category: string) {
    if (!detail) return;
    await updateDocumentMetadata(detail.id, {
      category,
      expiresAt: detail.expiresAt,
      tags: detail.tags,
      status: detail.status,
      clientId: detail.clientId,
    });
    const refreshed = await fetchVaultDocumentDetail(detail.id);
    setDetail(refreshed);
  }

  async function handleNewVersion(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !detail) return;

    setUploadingVersion(true);
    try {
      const supabase = createClient();
      const storagePath = `${detail.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadError) throw uploadError;

      await addDocumentVersion(detail.id, {
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
      });

      const refreshed = await fetchVaultDocumentDetail(detail.id);
      setDetail(refreshed);
    } finally {
      setUploadingVersion(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      {loading ? (
        <p className="py-8 text-center text-sm text-card-beige-muted-foreground">Carregando...</p>
      ) : loadError ? (
        <p className="py-8 text-center text-sm text-destructive">
          Não foi possível carregar este documento. Tente novamente em instantes.
        </p>
      ) : detail ? (
        <>
          <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                {detail.name}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleView}>
                <Eye className="h-3.5 w-3.5" />
                Visualizar
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                Baixar
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setSharing((s) => !s)}>
                <Share2 className="h-3.5 w-3.5" />
                Compartilhar
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={uploadingVersion} onClick={() => inputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                {uploadingVersion ? "Enviando..." : "Nova versão"}
              </Button>
              <input ref={inputRef} type="file" className="hidden" onChange={handleNewVersion} />
              <Button type="button" size="sm" variant="outline" onClick={handleArchiveToggle}>
                <Archive className="h-3.5 w-3.5" />
                {detail.status === "archived" ? "Reativar" : "Arquivar"}
              </Button>
            </div>

            {sharing ? <ShareForm documentId={detail.id} onDone={() => setSharing(false)} /> : null}

            <div className="grid grid-cols-2 gap-4 border-t border-black/10 pt-4 sm:grid-cols-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-card-beige-muted-foreground">Categoria</p>
                <Select value={detail.category ?? "outro"} onValueChange={(v) => v && handleCategoryChange(v)}>
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Cliente" value={detail.clientName} />
              <Field label="Contrato" value={detail.contractLabel} />
              <Field label="Tamanho" value={formatBytes(detail.latestFileSize)} />
              <Field label="Responsável pelo envio" value={detail.uploadedByName} />
              <Field label="Status" value={documentStatusLabel(detail.status)} />
              <Field label="Enviado em" value={formatDateTime(detail.createdAt)} />
              <Field label="Validade" value={detail.expiresAt ? formatDateTime(detail.expiresAt) : null} />
              <Field label="Tags" value={detail.tags.length > 0 ? detail.tags.join(", ") : null} />
            </div>

            <div className="border-t border-black/10 pt-4">
              <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">
                Versões ({detail.versions.length})
              </p>
              <div className="space-y-1.5">
                {detail.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-foreground">v{v.versionNumber}</span>
                    <span className="text-card-beige-muted-foreground">{formatBytes(v.fileSize)}</span>
                    <span className="text-card-beige-muted-foreground">
                      {formatDateTime(v.createdAt)}{v.uploadedByName ? ` · ${v.uploadedByName}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {detail.relationships.length > 0 ? (
              <div className="border-t border-black/10 pt-4">
                <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">Relacionamentos</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.relationships.map((r) => (
                    <span key={r.id} className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">
                      {relationshipTypeLabel(r.entityType)}: {r.entityLabel ?? r.entityId.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.shares.length > 0 ? (
              <div className="border-t border-black/10 pt-4">
                <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">Compartilhamentos</p>
                <div className="space-y-1.5">
                  {detail.shares.map((s) => (
                    <div key={s.id} className="rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-xs">
                      <span className="font-semibold text-foreground">{s.sharedWithName ?? "—"}</span>{" "}
                      <span className="text-card-beige-muted-foreground">
                        ({s.sharedWithType}) · {s.canDownload ? "visualizar + baixar" : "só visualizar"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-t border-black/10 pt-4">
              <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">Histórico de acesso</p>
              {detail.accessLog.length === 0 ? (
                <p className="text-xs text-card-beige-muted-foreground">Nenhum acesso registrado ainda.</p>
              ) : (
                <div className="space-y-1">
                  {detail.accessLog.slice(0, 8).map((a) => (
                    <p key={a.id} className="text-xs text-card-beige-muted-foreground">
                      {ACCESS_ACTION_LABEL[a.action] ?? a.action} {a.userName ? `por ${a.userName}` : ""} —{" "}
                      {formatDateTime(a.createdAt)}
                    </p>
                  ))}
                </div>
              )}
            </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-card-beige-muted-foreground">Documento não encontrado.</p>
      )}
    </>
  );
}

export function VaultDocumentDetailDialog({
  documentId,
  onClose,
}: {
  documentId: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={documentId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {documentId ? <DocumentDetailBody key={documentId} documentId={documentId} /> : null}
      </DialogContent>
    </Dialog>
  );
}
