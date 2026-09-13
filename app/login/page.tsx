"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("E-mail ou senha inválidos.");
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
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-border">
            <Image
              src="/primo-invest-logo.png"
              alt="Primo Invest"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>

          <p className="mt-4 text-label font-bold uppercase text-accent">Primo</p>
          <h1 className="mt-1 text-h2 font-heading font-bold text-foreground">
            Entrar na plataforma
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-label font-bold uppercase text-muted-foreground"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-4 focus:ring-ring/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-label font-bold uppercase text-muted-foreground"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-4 focus:ring-ring/20"
            />
          </div>

          {error ? (
            <p className="text-body-sm font-medium text-destructive">{error}</p>
          ) : null}

          <Button type="submit" disabled={loading} className="h-11 w-full justify-center">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
