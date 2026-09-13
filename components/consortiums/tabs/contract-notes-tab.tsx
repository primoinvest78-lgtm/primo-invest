"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateContractNotes } from "@/lib/actions/consortiums";

export function ContractNotesTab({
  contractId,
  clientId,
  notes,
}: {
  contractId: string;
  clientId: string | null;
  notes: string | null;
}) {
  const [value, setValue] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateContractNotes(contractId, clientId, value);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-h2 font-bold text-foreground">Observações</h3>
      <p className="mb-4 text-sm text-card-beige-muted-foreground">
        Notas internas do assessor sobre esse contrato — não visíveis pro cliente.
      </p>
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        rows={8}
        placeholder="Escreva observações sobre esse contrato..."
      />
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar observações"}
        </Button>
        {saved ? <span className="text-xs font-medium text-primary">Salvo.</span> : null}
      </div>
    </div>
  );
}
