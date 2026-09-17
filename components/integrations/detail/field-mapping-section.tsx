"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { createFieldMapping, deleteFieldMapping } from "@/lib/actions/integrations";
import type { FieldMapping } from "@/lib/data/integrations";
import {
  FIELD_MAPPING_STATUS_LABEL,
  FIELD_MAPPING_STATUSES,
  type FieldMappingStatus,
} from "@/lib/integrations/catalog";

const STATUS_CLASS: Record<string, string> = {
  mapped: "border-primary/40 bg-primary/10 text-primary",
  pending: "border-warning/40 bg-warning/15 text-warning",
  conflict: "border-destructive/40 bg-destructive/10 text-destructive",
};

function AddMappingDialog({ integrationId }: { integrationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sourceEntity, setSourceEntity] = useState("");
  const [sourceField, setSourceField] = useState("");
  const [targetEntity, setTargetEntity] = useState("");
  const [targetField, setTargetField] = useState("");
  const [status, setStatus] = useState<FieldMappingStatus>("pending");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function reset() {
    setSourceEntity("");
    setSourceField("");
    setTargetEntity("");
    setTargetField("");
    setStatus("pending");
    setNotes("");
  }

  function handleSubmit() {
    if (!sourceEntity.trim() || !sourceField.trim() || !targetEntity.trim() || !targetField.trim()) {
      setError("Preencha origem e destino do mapeamento.");
      return;
    }
    setError(null);
    startSave(async () => {
      try {
        await createFieldMapping({
          integrationId,
          sourceEntity,
          sourceField,
          targetEntity,
          targetField,
          status,
          notes: notes || null,
        });
        setOpen(false);
        reset();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar o mapeamento.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-3.5 w-3.5" />
        Novo mapeamento
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mapear campo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-label font-bold uppercase text-card-beige-muted-foreground">Origem</p>
            <div className="grid grid-cols-2 gap-3">
              <Input value={sourceEntity} onChange={(e) => setSourceEntity(e.target.value)} placeholder="Ex.: Cliente externo" />
              <Input value={sourceField} onChange={(e) => setSourceField(e.target.value)} placeholder="Ex.: Nome" />
            </div>
          </div>

          <div>
            <p className="mb-1 text-label font-bold uppercase text-card-beige-muted-foreground">Destino Primo Invest</p>
            <div className="grid grid-cols-2 gap-3">
              <Input value={targetEntity} onChange={(e) => setTargetEntity(e.target.value)} placeholder="Ex.: Cliente" />
              <Input value={targetField} onChange={(e) => setTargetField(e.target.value)} placeholder="Ex.: nome" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Status
            </label>
            <Select value={status} onValueChange={(v) => setStatus((v as FieldMappingStatus) ?? "pending")}>
              <SelectTrigger className="w-full">
                <SelectValue>{() => FIELD_MAPPING_STATUS_LABEL[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FIELD_MAPPING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {FIELD_MAPPING_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Observação
            </label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar mapeamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Origem → campo externo → campo Primo Invest → status. Fica vazio até
 * alguém cadastrar uma correspondência de verdade — nunca populado com
 * exemplo fictício, mesmo pra ilustrar o formato.
 */
export function FieldMappingSection({
  integrationId,
  mappings,
}: {
  integrationId: string;
  mappings: FieldMapping[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(mappingId: string) {
    setBusyId(mappingId);
    startTransition(async () => {
      try {
        await deleteFieldMapping(mappingId, integrationId);
        router.refresh();
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Mapeamento de dados
          </p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Origem → Primo Invest</h3>
        </div>
        <AddMappingDialog integrationId={integrationId} />
      </div>

      {mappings.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-body font-bold text-foreground">Nenhum mapeamento cadastrado ainda</p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Ex.: Cliente externo → Nome → Cliente.nome. Cadastre a correspondência assim que o
            conector real desta integração for definido.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border">
                {["Origem", "Campo externo", "Campo Primo Invest", "Status", ""].map((col, i) => (
                  <th key={col || i} className="px-3 py-2 text-left text-label font-bold uppercase text-card-beige-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => (
                <tr key={mapping.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-3 py-2 font-semibold text-foreground">{mapping.sourceEntity}</td>
                  <td className="px-3 py-2 text-card-beige-muted-foreground">{mapping.sourceField}</td>
                  <td className="px-3 py-2 text-card-beige-muted-foreground">
                    {mapping.targetEntity}.{mapping.targetField}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                        STATUS_CLASS[mapping.status] ?? "border-border text-card-beige-muted-foreground",
                      ].join(" ")}
                    >
                      {FIELD_MAPPING_STATUS_LABEL[mapping.status as FieldMappingStatus] ?? mapping.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover mapeamento"
                      onClick={() => handleDelete(mapping.id)}
                      disabled={pending && busyId === mapping.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
