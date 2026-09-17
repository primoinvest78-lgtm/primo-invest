import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthBypassEnabled } from "@/lib/dev/auth-bypass";

const PUBLIC_PATHS = [
  "/login",
  "/recuperar-senha",
  // Troca o `code` do Supabase por sessão (login com Google e
  // recuperação de senha) — precisa ser público porque roda ANTES de
  // existir sessão; ver app/auth/callback/route.ts.
  "/auth/callback",
  // Feed de calendário (.ics) — consultado por Google/Outlook/Apple
  // Calendar sem sessão de usuário nenhuma (não é o navegador que
  // acessa, é o serviço de calendário do usuário fazendo polling). A
  // autorização vem do token na própria URL, validado dentro da rota
  // via função SECURITY DEFINER — não por sessão. Ver
  // supabase/migrations/20260917010000_calendar_feed.sql.
  "/api/integracoes/calendario",
];

export async function updateSession(request: NextRequest) {
  // Ver lib/dev/auth-bypass.ts — só ativa fora de produção e com a env var
  // explícita. Deixa a requisição passar sem checar sessão nenhuma.
  if (isAuthBypassEnabled()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
