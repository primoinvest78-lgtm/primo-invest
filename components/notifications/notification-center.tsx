"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteReadNotifications, markAllNotificationsRead, markNotificationRead, markNotificationUnread } from "@/lib/actions/notifications";
import type { AppNotification } from "@/lib/data/notifications";
import { formatRelativeTime } from "@/lib/utils/format";

const SEVERITY: Record<AppNotification["severity"], { label: string; cls: string }> = {
  critico: { label: "Crítico", cls: "border-destructive/50 bg-destructive/[0.06]" },
  aviso: { label: "Atenção", cls: "border-warning/50 bg-warning/[0.06]" },
  info: { label: "Informação", cls: "border-black/10" },
};

export function NotificationCenter({ items, filter }: { items: AppNotification[]; filter: "todas" | "nao-lidas" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.readAt).length;
  const hasRead = items.some((n) => n.readAt);

  function act(fn: () => Promise<void>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <section className="card-premium space-y-4 rounded-2xl p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["todas", "nao-lidas"] as const).map((f) => (
            <Link
              key={f}
              href={f === "todas" ? "/notificacoes" : "/notificacoes?filtro=nao-lidas"}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "border-primary bg-primary/15" : "border-black/15 hover:bg-black/5"}`}
            >
              {f === "todas" ? "Todas" : "Não lidas"}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={pending || unread === 0} onClick={() => act(markAllNotificationsRead)}>
            Marcar todas como lidas
          </Button>
          <Button size="sm" variant="ghost" disabled={pending || !hasRead} onClick={() => act(deleteReadNotifications)}>
            Limpar as já lidas
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 px-4 py-10 text-center text-sm text-card-beige-muted-foreground">
          {filter === "nao-lidas" ? "Você não tem notificações não lidas." : "Nenhuma notificação por enquanto."}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((n, i) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-black/5 ${SEVERITY[n.severity].cls} ${n.readAt ? "opacity-75" : ""}`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  start(async () => {
                    if (!n.readAt) await markNotificationRead(n.id);
                    if (n.href) router.push(n.href);
                    else router.refresh();
                  })
                }
              >
                <p className={`text-sm ${n.readAt ? "font-medium" : "font-bold"} text-foreground`}>{n.title}</p>
                {n.message ? <p className="text-xs text-card-beige-muted-foreground">{n.message}</p> : null}
                <p className="mt-0.5 text-[11px] text-card-beige-muted-foreground">
                  {SEVERITY[n.severity].label}
                  {n.sourceModule ? ` · ${n.sourceModule}` : ""} · {formatRelativeTime(n.createdAt)}
                  {n.href ? " · clique para abrir" : ""}
                </p>
              </button>
              <Button size="xs" variant="ghost" disabled={pending} onClick={() => act(() => (n.readAt ? markNotificationUnread(n.id) : markNotificationRead(n.id)))}>
                {n.readAt ? "Marcar como não lida" : "Marcar como lida"}
              </Button>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
