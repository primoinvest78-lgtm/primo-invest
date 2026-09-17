"use client";

import { Upload } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

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
import { recordVaultDocument } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel, DOCUMENT_CATEGORIES } from "@/lib/utils/document-helpers";

export function VaultUploadDialog({
  organizationId,
  clients,
}: {
  organizationId: string;
  clients: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("outro");
  const [clientId, setClientId] = useState("none");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }

    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const supabase = createClient();
      const storagePath = `${organizationId}/cofre/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadError) throw uploadError;

      const tags = String(form.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await recordVaultDocument({
        name: String(form.get("name") ?? file.name),
        documentType: file.type || "outro",
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        clientId: clientId === "none" ? null : clientId,
        consortiumContractId: null,
        category,
        expiresAt: String(form.get("expiresAt") ?? "") || null,
        tags,
      });

      setOpen(false);
      setFile(null);
    } catch {
      setError("Não foi possível enviar o documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFile(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Upload className="h-3.5 w-3.5" />
        Enviar documento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar documento ao Cofre</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
          />
          <Input name="name" placeholder="Nome do documento (opcional)" defaultValue={file?.name ?? ""} />

          <Select value={category} onValueChange={(v) => setCategory(v ?? "outro")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientId} onValueChange={(v) => setClientId(v ?? "none")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Cliente (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem cliente vinculado</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input name="tags" placeholder="Tags separadas por vírgula (opcional)" />
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">
              Validade (opcional)
            </label>
            <Input name="expiresAt" type="date" />
          </div>

          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
