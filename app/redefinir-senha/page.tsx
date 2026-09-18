"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-label font-bold uppercase text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          autoComplete="new-password"
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background px-4 pr-11 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-4 focus:ring-ring/20"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Chegada aqui só acontece com uma sessão de recuperação já ativa
 * (trocada em app/auth/callback/route.ts a partir do link do e-mail).
 * Por isso esta rota NÃO está em PUBLIC_PATHS: se estivesse, o
 * middleware bateria "usuário logado num caminho público" e mandaria
 * pro /dashboard antes de dar tempo de trocar a senha.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Não foi possível atualizar a senha. Peça um novo link de recuperação.");
      setLoading(false);
      return;
    }

    // Encerra a sessão de recuperação de propósito — a troca de senha
    // não deve logar o usuário automaticamente. Ele confirma a senha
    // nova fazendo login com ela, não ficando "logado por tabela".
    await supabase.auth.signOut();
    router.push("/login?sucesso=senha-redefinida");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-secondary shadow-md">
            <Image
              src="/primo-invest-logo.png"
              alt="Primo Invest"
              width={80}
              height={80}
              className="object-cover"
              priority
            />
          </div>

          <p className="mt-4 text-label font-bold uppercase text-accent">Primo</p>
          <h1 className="mt-1 text-h2 font-heading font-bold text-foreground">
            Criar nova senha
          </h1>
          <p className="mt-2 text-body-sm text-muted-foreground">
            Escolha uma senha nova para sua conta. Depois de salvar, você vai precisar entrar de
            novo com ela.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField id="password" label="Nova senha" value={password} onChange={setPassword} autoFocus />

          <div>
            <PasswordField
              id="confirmPassword"
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {passwordsMatch ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-caption font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                As senhas coincidem
              </p>
            ) : passwordsMismatch ? (
              <p className="mt-1.5 text-caption font-semibold text-destructive">
                As senhas ainda não coincidem
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted px-3.5 py-2.5 text-caption text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            Use pelo menos 8 caracteres. Use o ícone do olho pra conferir o que você digitou antes
            de salvar.
          </div>

          {error ? (
            <p className="text-body-sm font-medium text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading || passwordsMismatch}
            className="h-11 w-full justify-center"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
