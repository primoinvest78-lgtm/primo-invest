"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { LOGO_SRC } from "@/lib/constants/brand";
import { createClient } from "@/lib/supabase/client";
import { AUTH_INPUT_CLASS } from "@/lib/utils/auth-ui";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.9l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("erro") === "auth" ? "Não foi possível concluir o login. Tente novamente." : null,
  );
  const [success] = useState<string | null>(
    searchParams.get("sucesso") === "senha-redefinida"
      ? "Senha redefinida com sucesso! Entre com sua nova senha."
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (oauthError) {
      console.error("[login] signInWithOAuth falhou:", oauthError.message);
      setError("Não foi possível iniciar o login com Google.");
      setGoogleLoading(false);
    }
    // Sucesso redireciona o navegador pro Google — nada mais a fazer aqui.
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4">
      <div className="card-premium w-full max-w-[400px] rounded-2xl p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-secondary shadow-md">
            <Image
              src={LOGO_SRC}
              alt="Primo Invest"
              width={80}
              height={80}
              className="object-cover"
              priority
            />
          </div>

          <p className="mt-4 text-label font-bold uppercase text-accent">Primo</p>
          <h1 className="mt-1 text-h2 font-heading font-bold text-foreground">
            Entrar na plataforma
          </h1>
        </div>

        {success ? (
          <p className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-body-sm font-medium text-primary">
            {success}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-label font-bold uppercase text-card-beige-muted-foreground"
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
              className={AUTH_INPUT_CLASS}
            />
          </div>

          <PasswordField
            id="password"
            label="Senha"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            labelExtra={
              <Link
                href="/recuperar-senha"
                className="text-label font-bold text-accent hover:underline"
              >
                Esqueci minha senha
              </Link>
            }
          />

          {error ? (
            <p className="text-body-sm font-medium text-destructive">{error}</p>
          ) : null}

          <Button type="submit" disabled={loading} className="h-11 w-full justify-center">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-label font-bold uppercase text-card-beige-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
          className="h-11 w-full justify-center gap-2.5 bg-card"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecionando..." : "Entrar com Google"}
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-secondary" />}>
      <LoginForm />
    </Suspense>
  );
}
