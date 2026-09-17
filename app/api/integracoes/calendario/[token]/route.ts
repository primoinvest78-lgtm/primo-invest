import { NextResponse, type NextRequest } from "next/server";

import { buildIcsFeed, type CalendarFeedTask } from "@/lib/integrations/calendar-feed";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Feed público de calendário (.ics) — consultado direto pelo
 * Google/Outlook/Apple Calendar do usuário, sem sessão de navegador
 * nenhuma. A autorização é o token na própria URL: `consume_calendar_feed`
 * (SECURITY DEFINER) valida o token e devolve só as tarefas do dono
 * daquele token, e registra a sincronização de verdade — essa
 * requisição sendo servida É a sincronização, não uma simulação dela.
 *
 * Middleware: esta rota está em PUBLIC_PATHS (ver lib/supabase/middleware.ts)
 * — sem isso, o redirecionamento pra /login bloquearia qualquer app de
 * calendário externo antes mesmo de chegar aqui.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await params;
  const token = rawToken.replace(/\.ics$/i, "");

  if (!token || token.length < 16) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_calendar_feed", { p_token: token });

  if (error) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rows = (data ?? []) as {
    task_id: string;
    title: string;
    description: string | null;
    due_at: string;
    status: string;
    priority: string;
    category: string | null;
  }[];

  // Token inválido/revogado também devolve zero linhas — resposta
  // idêntica a "sem tarefas" de propósito, pra não confirmar pra quem
  // tentar adivinhar um token se ele existe ou não.
  const tasks: CalendarFeedTask[] = rows.map((row) => ({
    taskId: row.task_id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    status: row.status,
    priority: row.priority,
    category: row.category,
  }));

  const ics = buildIcsFeed(tasks, "Primo Invest — Minhas tarefas");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=900",
    },
  });
}
