"use client";

import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { fetchNotificationSummary, markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import type { AppNotification } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils/format";

const DOT: Record<AppNotification["severity"], string> = {
  critico: "bg-destructive",
  aviso: "bg-warning",
  info: "bg-primary",
};

/**
 * Sino de notificações internas: contagem real de não lidas, lista das
 * mais recentes, atualização em tempo real (Supabase Realtime, só as
 * linhas do próprio usuário — o RLS garante) e atalhos pra ler tudo.
 */
export function NotificationBell({
  userId,
  initial,
}: {
  userId: string;
  initial: { items: AppNotification[]; unread: number };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial.items);
  const [unread, setUnread] = useState(initial.unread);
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const s = await fetchNotificationSummary();
        setItems(s.items);
        setUnread(s.unread);
      } catch {
        // Sem sessão/rede: mantém o que já está na tela.
      }
    });
  }

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channel = supabase
      .channel(`notificacoes-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => refresh())
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [userId]);

  function openItem(n: AppNotification) {
    setOpen(false);
    if (!n.readAt) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(u - 1, 0));
      startTransition(() => markNotificationRead(n.id));
    }
    if (n.href) router.push(n.href);
  }

  function readAll() {
    setItems((list) => list.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    setUnread(0);
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `Notificações: ${unread} não lida(s)` : "Notificações"}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh();
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/50"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <button type="button" aria-label="Fechar notificações" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="card-premium absolute right-0 top-[calc(100%+8px)] z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl shadow-card-lg"
            >
              <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
                <p className="text-sm font-bold text-foreground">
                  Notificações{unread > 0 ? <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{unread}</span> : null}
                </p>
                <button
                  type="button"
                  onClick={readAll}
                  disabled={unread === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-default disabled:border-white/10 disabled:bg-secondary disabled:text-secondary-foreground disabled:opacity-70"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Ler todas
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-card-beige-muted-foreground">Nenhuma notificação por enquanto.</p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openItem(n)}
                      className={`flex w-full gap-3 border-b border-black/5 px-4 py-3 text-left transition-colors hover:bg-black/5 ${n.readAt ? "opacity-70" : ""}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent ring-1 ring-black/20" : DOT[n.severity]}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${n.readAt ? "font-medium" : "font-bold"} text-foreground`}>{n.title}</span>
                        {n.message ? <span className="line-clamp-2 block text-xs text-card-beige-muted-foreground">{n.message}</span> : null}
                        <span className="mt-0.5 block text-[11px] text-card-beige-muted-foreground">
                          {n.sourceModule ? `${n.sourceModule} · ` : ""}
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <Link
                href="/notificacoes"
                onClick={() => setOpen(false)}
                className="block border-t border-black/10 px-4 py-2.5 text-center text-xs font-semibold text-accent hover:bg-black/5"
              >
                Ver todas as notificações
              </Link>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
