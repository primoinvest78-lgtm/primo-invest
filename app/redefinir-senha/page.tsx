"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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

    router.push("/dashboard");
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-label font-bold uppercase text-muted-foreground"
            >
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-4 focus:ring-ring/20"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-label font-bold uppercase text-muted-foreground"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-4 focus:ring-ring/20"
            />
          </div>

          {error ? (
            <p className="text-body-sm font-medium text-destructive">{error}</p>
          ) : null}

          <Button type="submit" disabled={loading} className="h-11 w-full justify-center">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
