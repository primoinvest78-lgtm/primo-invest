"use client";

import { ClipboardPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { createTaskFromInsight } from "@/lib/actions/intelligence";
import type { Insight } from "@/lib/intelligence/types";

/**
 * Criação rápida de tarefa a partir de um insight — o título já vem
 * sugerido pela regra (`suggestedAction`), mas fica editável: a IA/regra
 * sugere, a pessoa confirma. Nenhuma tarefa é criada sem essa
 * confirmação explícita.
 */
export function CreateTaskFromInsightDialog({ insight }: { insight: Insight }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? insight.suggestedAction);
    const description = String(form.get("description") ?? "");
    const dueAt = String(form.get("dueAt") ?? "");

    startTransition(async () => {
      await createTaskFromInsight({
        insight: {
          key: insight.key,
          title: insight.title,
          sourceModule: insight.sourceModule,
          clientId: insight.clientId,
          priority: insight.priority,
          reason: insight.reason,
        },
        taskTitle: title,
        taskDescription: description || insight.reason,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <ClipboardPlus className="h-3.5 w-3.5" />
        Criar tarefa
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar tarefa a partir do insight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" defaultValue={insight.suggestedAction} required />
          <Textarea name="description" defaultValue={insight.reason} rows={3} />
          <Input name="dueAt" type="datetime-local" />
          {insight.clientName ? (
            <p className="text-caption text-card-beige-muted-foreground">
              Vinculada a {insight.clientName}.
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Criar tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
