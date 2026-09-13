"use client";

import { Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import {
  createClientInteraction,
  createClientNote,
  deleteClientInteraction,
  deleteClientNote,
  updateClientNote,
} from "@/lib/actions/client-relationship";
import { deleteTask, updateTask } from "@/lib/actions/tasks";
import type { ClientProfile } from "@/lib/data/clients";
import { formatDateTime } from "@/lib/utils/format";

const INTERACTION_LABEL: Record<string, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
};

function NewInteractionDialog({ clientId }: { clientId: string }) {
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
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Nova interação
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar interação</DialogTitle>
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

function NewNoteDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await createClientNote(clientId, {
      title: String(form.get("title") ?? ""),
      content: String(form.get("content") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Nova nota</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nota</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título (opcional)" />
          <Textarea name="content" placeholder="Conteúdo" rows={4} required />
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

function EditNoteDialog({
  clientId,
  noteId,
  title,
  content,
}: {
  clientId: string;
  noteId: string;
  title: string;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    await updateClientNote(noteId, clientId, {
      title: String(form.get("title") ?? ""),
      content: String(form.get("content") ?? ""),
    });

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar nota" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar nota</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título (opcional)" defaultValue={title} />
          <Textarea name="content" placeholder="Conteúdo" rows={4} required defaultValue={content} />
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

function EditTaskDialog({
  clientId,
  taskId,
  title,
  dueAt,
  priority,
}: {
  clientId: string;
  taskId: string;
  title: string;
  dueAt: string | null;
  priority: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priorityValue, setPriorityValue] = useState(priority);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const dueAtValue = String(form.get("dueAt") ?? "");

    await updateTask(
      taskId,
      {
        title: String(form.get("title") ?? ""),
        dueAt: dueAtValue ? new Date(dueAtValue).toISOString() : null,
        priority: priorityValue,
      },
      { clientId },
    );

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" aria-label="Editar tarefa" />}
        className="text-card-beige-muted-foreground transition-colors hover:text-accent"
      >
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Título" required defaultValue={title} />
          <Input
            name="dueAt"
            type="datetime-local"
            defaultValue={dueAt ? dueAt.slice(0, 16) : ""}
          />
          <Select value={priorityValue} onValueChange={(v) => setPriorityValue(v ?? "normal")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
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

type TimelineEntry = {
  id: string;
  kind: "interaction" | "note" | "task";
  date: string;
  title: string;
  description: string | null;
  raw: { title: string; content: string } | { title: string; dueAt: string | null; priority: string };
};

export function RelationshipTab({ client }: { client: ClientProfile }) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const entries: TimelineEntry[] = [
    ...client.interactions.map((i) => ({
      id: i.id,
      kind: "interaction" as const,
      date: i.occurred_at,
      title: `${INTERACTION_LABEL[i.interaction_type] ?? i.interaction_type}${i.subject ? ` — ${i.subject}` : ""}`,
      description: i.description,
      raw: { title: "", content: "" },
    })),
    ...client.client_notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      date: n.created_at,
      title: n.title ?? "Nota",
      description: n.content,
      raw: { title: n.title ?? "", content: n.content },
    })),
    ...client.tasks.map((t) => ({
      id: t.id,
      kind: "task" as const,
      date: t.due_at ?? "",
      title: t.title,
      description: t.description,
      raw: { title: t.title, dueAt: t.due_at, priority: t.priority },
    })),
  ]
    .filter((e) => !deletedIds.has(`${e.kind}-${e.id}`))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  async function handleDelete(entry: TimelineEntry) {
    const key = `${entry.kind}-${entry.id}`;
    setDeletedIds((prev) => new Set(prev).add(key));

    if (entry.kind === "interaction") await deleteClientInteraction(entry.id, client.id);
    else if (entry.kind === "note") await deleteClientNote(entry.id, client.id);
    else await deleteTask(entry.id, { clientId: client.id });
  }

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-h2 font-bold text-foreground">Linha do tempo de relacionamento</h3>
        <div className="flex gap-2">
          <NewInteractionDialog clientId={client.id} />
          <NewNoteDialog clientId={client.id} />
          <NewTaskDialog clientId={client.id} />
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma interação, nota ou tarefa registrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={`${entry.kind}-${entry.id}`}
              className="rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {entry.kind === "task" ? "Tarefa: " : ""}
                  {entry.title}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  {entry.date ? (
                    <p className="text-xs font-medium text-card-beige-muted-foreground">
                      {formatDateTime(entry.date)}
                    </p>
                  ) : null}
                  {entry.kind === "note" ? (
                    <EditNoteDialog
                      clientId={client.id}
                      noteId={entry.id}
                      title={(entry.raw as { title: string; content: string }).title}
                      content={(entry.raw as { title: string; content: string }).content}
                    />
                  ) : null}
                  {entry.kind === "task" ? (
                    <EditTaskDialog
                      clientId={client.id}
                      taskId={entry.id}
                      title={(entry.raw as { title: string; dueAt: string | null; priority: string }).title}
                      dueAt={(entry.raw as { title: string; dueAt: string | null; priority: string }).dueAt}
                      priority={(entry.raw as { title: string; dueAt: string | null; priority: string }).priority}
                    />
                  ) : null}
                  <button
                    type="button"
                    aria-label="Excluir"
                    onClick={() => handleDelete(entry)}
                    className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {entry.description ? (
                <p className="mt-1 text-xs text-card-beige-muted-foreground">
                  {entry.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
