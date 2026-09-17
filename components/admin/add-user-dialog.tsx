"use client";

import { Loader2, UserPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addOrgMember } from "@/lib/actions/admin";
import { APP_ROLES, ROLE_LABEL, type AppRole } from "@/lib/admin/roles";

const RESULT_MESSAGE: Record<string, string> = {
  added: "Usuário adicionado como convite pendente.",
  already_member: "Essa pessoa já faz parte da organização.",
  not_found: "Nenhuma conta encontrada com esse e-mail. A pessoa precisa criar uma conta na Primo Invest antes de ser adicionada.",
};

/**
 * Vincula um usuário JÁ CADASTRADO na plataforma à organização — não
 * existe fluxo de convite por e-mail nem criação de conta pelo admin
 * (exigiria uma chave de serviço que não temos). Buscamos por e-mail e
 * deixamos claro quando a conta ainda não existe.
 */
export function AddUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<AppRole>("advisor");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setFeedback(null);

    startTransition(async () => {
      const result = await addOrgMember({ email, role });
      const message = RESULT_MESSAGE[result.status] ?? "Não foi possível concluir.";
      setFeedback({ ok: result.status === "added", text: message });
      if (result.status === "added") {
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFeedback(null);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="h-3.5 w-3.5" />
        Adicionar usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar usuário à organização</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              E-mail
            </label>
            <Input name="email" type="email" placeholder="pessoa@exemplo.com" required />
            <p className="mt-1 text-caption text-card-beige-muted-foreground">
              A pessoa precisa já ter uma conta na Primo Invest.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Perfil
            </label>
            <Select value={role} onValueChange={(v) => setRole((v as AppRole) ?? "advisor")}>
              <SelectTrigger className="w-full">
                <SelectValue>{() => ROLE_LABEL[role]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {feedback ? (
            <p className={feedback.ok ? "text-body-sm font-semibold text-primary" : "text-body-sm font-semibold text-destructive"}>
              {feedback.text}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
