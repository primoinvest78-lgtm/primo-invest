"use client";

import { Loader2, Mail, UserPlus } from "lucide-react";
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
import { addOrgMember, inviteOrgMember } from "@/lib/actions/admin";
import { APP_ROLES, ROLE_LABEL, type AppRole } from "@/lib/admin/roles";

const RESULT_MESSAGE: Record<string, string> = {
  added: "Usuário adicionado como convite pendente.",
  already_member: "Essa pessoa já faz parte da organização.",
  not_found: "Nenhuma conta encontrada com esse e-mail. A pessoa precisa criar uma conta na Primo Invest antes de ser adicionada.",
};

/**
 * Duas saídas: "Enviar convite" (principal) manda um link de acesso por
 * e-mail, cria a conta se preciso e já libera o acesso — a pessoa cria a
 * senha em /definir-senha. "Só vincular" mantém o fluxo antigo para quem
 * já tem conta e deve entrar como convite pendente.
 */
export function AddUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<AppRole>("advisor");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [mode, setMode] = useState<"invite" | "link">("invite");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const submitMode = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "link" ? "link" : "invite";
    setMode(submitMode);
    setFeedback(null);

    startTransition(async () => {
      if (submitMode === "invite") {
        const result = await inviteOrgMember({ email, role });
        setFeedback({ ok: result.ok, text: result.message });
        if (result.ok) router.refresh();
        return;
      }
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
              O convite chega por e-mail com um link para entrar e criar a senha. O acesso já fica ativo.
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
            <Button type="submit" name="acao" value="link" variant="outline" disabled={pending}>
              {pending && mode === "link" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Só vincular conta existente
            </Button>
            <Button type="submit" name="acao" value="invite" disabled={pending}>
              {pending && mode === "invite" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
