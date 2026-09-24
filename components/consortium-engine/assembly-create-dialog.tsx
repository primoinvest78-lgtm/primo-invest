"use client";

import { useState, type FormEvent } from "react";

import { Feedback, Field, NativeSelect, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createAssembly } from "@/lib/actions/consortium-engine";
import type { EngineGroup } from "@/lib/data/consortium-engine";

export function AssemblyCreateDialog({ groups, fixedGroupId }: { groups: EngineGroup[]; fixedGroupId?: string }) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(fixedGroupId ?? groups[0]?.id ?? "");
  const { pending, errors, message, execute } = useEngineAction();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    execute(
      () =>
        createAssembly({
          groupId,
          assemblyNumber: Number(f.get("assemblyNumber")),
          assemblyDate: String(f.get("assemblyDate")),
          plannedDrawContemplations: Number(f.get("planned") ?? 1),
          notes: String(f.get("notes") ?? ""),
        }),
      () => setOpen(false),
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nova assembleia</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova assembleia</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {!fixedGroupId ? (
            <Field label="Grupo">
              <NativeSelect
                value={groupId}
                onChange={setGroupId}
                options={groups.map((g) => ({ value: g.id, label: `${g.administratorName} · ${g.groupCode}` }))}
              />
            </Field>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Número da assembleia">
              <Input name="assemblyNumber" type="number" min={1} required />
            </Field>
            <Field label="Data">
              <Input name="assemblyDate" type="date" required />
            </Field>
          </div>
          <Field
            label="Contemplações previstas por sorteio"
            hint="Teto previsto no regulamento. O número real depende dos recursos (calculado na apuração)."
          >
            <Input name="planned" type="number" min={0} defaultValue={1} required />
          </Field>
          <Field label="Observações">
            <Input name="notes" />
          </Field>
          <Feedback errors={errors} message={message} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !groupId}>
              {pending ? "Salvando…" : "Criar assembleia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
