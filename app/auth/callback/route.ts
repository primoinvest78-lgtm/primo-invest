import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback único pro fluxo PKCE do Supabase — login com Google e
 * recuperação de senha caem os dois aqui, com o mesmo `code` trocado
 * por sessão. `next` diz pra onde ir depois: o botão do Google não
 * passa nada (cai no padrão /dashboard); o e-mail de recuperação de
 * senha manda `next=/redefinir-senha`, onde o usuário troca a senha
 * já autenticado por essa sessão temporária de recuperação.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Troca falhou (código expirado/já usado, etc.) — encerra qualquer
  // sessão que ainda esteja nos cookies antes de mandar pro /login.
  // Sem isso, se o navegador já tivesse uma sessão válida de antes
  // (ex.: login Google recente), o middleware via "logado + rota
  // pública" e mandava direto pro /dashboard, escondendo o erro real.
  await supabase.auth.signOut();

  const url = new URL("/login", origin);
  url.searchParams.set("erro", "auth");
  return NextResponse.redirect(url);
}
