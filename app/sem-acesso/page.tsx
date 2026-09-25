import Image from "next/image";
import { redirect } from "next/navigation";

import { NoAccessActions } from "@/components/auth/no-access-actions";
import { LOGO_SRC } from "@/lib/constants/brand";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Conta autenticada (ex.: entrou pelo Google) mas sem vínculo ativo com
 * a organização. Mostra com clareza qual e-mail entrou e como resolver,
 * em vez da tela genérica de erro.
 */
export default async function SemAcessoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("status")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membership?.status === "active") redirect("/dashboard");
  const pending = membership?.status === "invited";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4 py-10">
      <div className="card-premium w-full max-w-[460px] rounded-2xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-secondary shadow-md">
            <Image src={LOGO_SRC} alt="Primo Invest" width={80} height={80} className="object-cover" priority />
          </div>
          <p className="mt-4 text-label font-bold uppercase text-accent">Primo Invest</p>
          <h1 className="mt-1 text-h2 font-heading font-bold text-foreground">
            {pending ? "Acesso aguardando liberação" : "Esta conta não tem acesso"}
          </h1>
          <p className="mt-3 text-sm text-card-beige-muted-foreground">Você entrou com a conta:</p>
          <p className="mt-1 break-all rounded-lg bg-secondary px-3 py-2 font-semibold text-secondary-foreground">{user.email}</p>
          <p className="mt-4 text-sm leading-6 text-foreground">
            {pending
              ? "O convite desta conta já foi criado. Falta um administrador clicar em “Ativar acesso” em Administração → Usuários."
              : "Ela ainda não foi liberada no Primo Invest. Peça a um administrador para adicioná-la em Administração → Usuários, ou entre com outra conta."}
          </p>
        </div>
        <div className="mt-6">
          <NoAccessActions />
        </div>
      </div>
    </div>
  );
}
