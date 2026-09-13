"use client";

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
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { createClientInteraction } from "@/lib/actions/client-relationship";
import { addHouseholdMember } from "@/lib/actions/household";
import { createOpportunityForClient } from "@/lib/actions/opportunities";

function QuickContactDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("call");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    await createClientInteraction(clientId, {
      interactionType: type,
      subject: String(form.get("subject") ?? ""),
      description: String(form.get("description") ?? ""),
    });
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Novo contato</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={type} onValueChange={(v) => setType(v ?? "call")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Ligação</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
            </SelectContent>
          </Select>
          <Input name="subject" placeholder="Assunto" required />
          <Textarea name="description" placeholder="Descrição" rows={3} />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuickOpportunityDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("investimento");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const value = String(form.get("estimatedValue") ?? "");
    await createOpportunityForClient(clientId, {
      title: String(form.get("title") ?? ""),
      opportunityType: type,
      estimatedValue: value ? Number(value) : null,
    });
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Nova oportunidade
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título" required />
          <Select value={type} onValueChange={(v) => setType(v ?? "investimento")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="investimento">Investimento</SelectItem>
              <SelectItem value="aporte">Aporte</SelectItem>
              <SelectItem value="consorcio">Consórcio</SelectItem>
              <SelectItem value="planejamento">Planejamento</SelectItem>
              <SelectItem value="outro">Outro produto</SelectItem>
            </SelectContent>
          </Select>
          <Input name="estimatedValue" type="number" step="0.01" placeholder="Valor estimado" />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuickFamilyMemberDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    await addHouseholdMember(clientId, {
      name: String(form.get("name") ?? ""),
      relationship: String(form.get("relationship") ?? ""),
    });
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Novo membro familiar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro do núcleo familiar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="name" placeholder="Nome completo" required />
          <Input name="relationship" placeholder="Grau de relacionamento (ex: cônjuge, filho)" required />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientQuickActions({ clientId }: { clientId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <NewTaskDialog clientId={clientId} />
      <QuickContactDialog clientId={clientId} />
      <QuickOpportunityDialog clientId={clientId} />
      <QuickFamilyMemberDialog clientId={clientId} />
    </div>
  );
}
