"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { LOGO_SRC } from "@/lib/constants/brand";
import { createClient } from "@/lib/supabase/client";

type Stage = "checking" | "ready" | "expired";

/**
 * Chegada pelo link do convite (lib/actions/admin.ts → inviteOrgMember).
 * O link traz a sessão no fragmento da URL (#access_token=…), que o
 * servidor nunca vê — por isso a página é cliente e grava a sessão aqui.
 * Está em PUBLIC_OPEN_PATHS: o convidado chega sem sessão e, depois de
 * gravá-la, continua nesta tela para criar a senha sem ser redirecionado.
 */
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // O fragmento é lido e apagado uma única vez — no modo estrito do
    // React o efeito roda duas vezes e a segunda leitura viria vazia.
    if (started.current) return;
    started.current = true;
    const supabase = createClient();
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);

    (async () => {
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) console.error("[definir-senha] setSession falhou:", sessionError.message);
      } else if (params.get("error")) {
        console.error("[definir-senha] link recusado:", params.get("error_code"), params.get("error_description"));
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStage("ready");
      } else {
        setStage("expired");
      }
    })();
  }, []);

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
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      console.error("[definir-senha] updateUser falhou:", updateError.message);
      setError("Não foi possível salvar a senha. Tente de novo ou peça um novo convite.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4 py-10">
      <div className="card-premium w-full max-w-[420px] rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-secondary shadow-md">
            <Image src={LOGO_SRC} alt="Primo Invest" width={80} height={80} className="object-cover" priority />
          </div>
          <p className="mt-4 text-label font-bold uppercase text-accent">Primo Invest</p>
          <h1 className="mt-1 text-h2 font-heading font-bold text-foreground">
            {stage === "expired" ? "Link inválido ou vencido" : "Bem-vindo! Crie sua senha"}
          </h1>
          {stage === "ready" && email ? (
            <p className="mt-2 text-body-sm text-card-beige-muted-foreground">
              Sua conta: <strong className="break-all text-foreground">{email}</strong>
            </p>
          ) : null}
        </div>

        {stage === "checking" ? (
          <p className="flex items-center justify-center gap-2 text-body-sm text-card-beige-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Conferindo seu convite...
          </p>
        ) : stage === "expired" ? (
          <div className="space-y-4 text-center">
            <p className="text-body-sm text-card-beige-muted-foreground">
              Este link já foi usado ou venceu. Peça ao administrador um novo convite, ou entre pela
              tela de login usando “Esqueci minha senha”.
            </p>
            <Link href="/login" className="inline-flex text-body-sm font-bold text-accent hover:underline">
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              id="password"
              label="Senha"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              autoFocus
            />

            <div>
              <PasswordField
                id="confirmPassword"
                label="Confirmar senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
              {passwordsMatch ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-caption font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  As senhas coincidem
                </p>
              ) : passwordsMismatch ? (
                <p className="mt-1.5 text-caption font-semibold text-destructive">As senhas ainda não coincidem</p>
              ) : null}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-2.5 text-caption text-card-beige-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              Use pelo menos 8 caracteres. Nas próximas vezes, entre com este e-mail e esta senha.
            </div>

            {error ? <p className="text-body-sm font-medium text-destructive">{error}</p> : null}

            <Button type="submit" disabled={loading || passwordsMismatch} className="h-11 w-full justify-center">
              {loading ? "Salvando..." : "Salvar senha e entrar"}
            </Button>

            <Link
              href="/dashboard"
              className="block text-center text-caption font-semibold text-card-beige-muted-foreground hover:text-accent hover:underline"
            >
              Agora não, ir direto para o painel
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
