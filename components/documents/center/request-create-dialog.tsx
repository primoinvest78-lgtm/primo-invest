"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { createDocumentRequest } from "@/lib/actions/document-requests";
import { categoryLabel, DOCUMENT_CATEGORIES } from "@/lib/utils/document-helpers";
import { RESPONSIBLE_ROLE_LABEL } from "@/lib/utils/document-center-helpers";

const NONE = "none";

export function RequestCreateDialog({
  clients,
  advisors,
  consortiumContracts,
}: {
  clients: { id: string; fullName: string }[];
  advisors: { id: string; fullName: string }[];
  consortiumContracts: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(NONE);
  const [category, setCategory] = useState(NONE);
  const [responsibleRole, setResponsibleRole] = useState(NONE);
  const [responsibleId, setResponsibleId] = useState(NONE);
  const [contractId, setContractId] = useState(NONE);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const dueDate = String(form.get("dueDate") ?? "");

    await createDocumentRequest({
      clientId: clientId === NONE ? null : clientId,
      title: String(form.get("title") ?? ""),
      category: category === NONE ? null : category,
      description: String(form.get("description") ?? "") || null,
      dueDate: dueDate || null,
      responsibleRole: responsibleRole === NONE ? null : responsibleRole,
      responsibleId: responsibleId === NONE ? null : responsibleId,
      entityType: contractId === NONE ? null : "consortium_contract",
      entityId: contractId === NONE ? null : contractId,
    });

    setLoading(false);
    setOpen(false);
    setClientId(NONE);
    setCategory(NONE);
    setResponsibleRole(NONE);
    setResponsibleId(NONE);
    setContractId(NONE);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-3.5 w-3.5" />
        Solicitar documento
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Cliente</label>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem cliente específico</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Documento necessário</label>
              <Input name="title" placeholder="Ex.: RG atualizado, comprovante de residência..." required />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Categoria</label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem categoria</SelectItem>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Prazo</label>
              <Input name="dueDate" type="date" />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Responsável (papel)</label>
              <Select value={responsibleRole} onValueChange={(v) => setResponsibleRole(v ?? NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não definido</SelectItem>
                  {Object.entries(RESPONSIBLE_ROLE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Assessor responsável</label>
              <Select value={responsibleId} onValueChange={(v) => setResponsibleId(v ?? NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assessor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não definido</SelectItem>
                  {advisors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {consortiumContracts.length > 0 ? (
              <div className="col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                  Vincular a um contrato de consórcio (opcional)
                </label>
                <Select value={contractId} onValueChange={(v) => setContractId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum</SelectItem>
                    {consortiumContracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase text-card-beige-muted-foreground">Observação</label>
              <Textarea name="description" placeholder="Detalhes adicionais sobre a solicitação..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
