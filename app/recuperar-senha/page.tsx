"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AUTH_INPUT_CLASS } from "@/lib/utils/auth-ui";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });

    // Sempre mostra a mesma mensagem de sucesso, exista ou não esse
    // e-mail na base — não dá pra um e-mail aleatório usar essa tela
    // pra descobrir quem tem conta na plataforma.
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4">
      <div className="card-premium w-full max-w-[400px] rounded-2xl p-8">
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
            Recuperar senha
          </h1>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-body-sm text-card-beige-muted-foreground">
              Se <strong className="text-foreground">{email}</strong> tiver uma conta na
              plataforma, um link para redefinir a senha foi enviado. Confira também a caixa de
              spam.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-body-sm font-bold text-accent hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-body-sm text-card-beige-muted-foreground">
              Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
            </p>

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
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full justify-center">
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-body-sm font-bold text-accent hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
