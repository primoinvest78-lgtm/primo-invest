import { Calendar, CheckCircle2, FileText, MessageSquare, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { MeetingPreparation } from "@/lib/intelligence/meeting";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";
import { PRIORITY_LABEL } from "@/lib/utils/task-helpers";

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Calendar;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-premium rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-body font-bold text-foreground">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-body-sm text-card-beige-muted-foreground">{children}</p>;
}

/**
 * Estrutura factual de preparação de reunião — só reorganiza dado que
 * já existe (ver `buildMeetingPreparation`). Nenhum resumo em texto é
 * gerado aqui; isso é papel de uma futura IA (ver
 * `generateMeetingSummary` em `lib/intelligence/ai.ts`).
 */
export function MeetingPrepPanel({ prep }: { prep: MeetingPreparation }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Block icon={MessageSquare} title="Última interação">
        {prep.lastInteraction ? (
          <div>
            <p className="text-body-sm font-semibold text-foreground">
              {prep.lastInteraction.subject ?? prep.lastInteraction.type}
            </p>
            <p className="text-caption text-card-beige-muted-foreground">
              {formatDateTime(prep.lastInteraction.occurredAt)}
              {prep.daysSinceLastInteraction !== null
                ? ` · há ${prep.daysSinceLastInteraction} ${prep.daysSinceLastInteraction === 1 ? "dia" : "dias"}`
                : ""}
            </p>
          </div>
        ) : (
          <Empty>Nenhuma interação registrada ainda.</Empty>
        )}

        {prep.recentInteractions.length > 1 ? (
          <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
            {prep.recentInteractions.slice(1).map((i) => (
              <li key={i.id} className="text-caption text-card-beige-muted-foreground">
                {formatDate(i.occurredAt)} — {i.subject ?? i.type}
              </li>
            ))}
          </ul>
        ) : null}
      </Block>

      <Block icon={CheckCircle2} title="Tarefas abertas">
        {prep.openTasks.length === 0 ? (
          <Empty>Nenhuma tarefa aberta para este cliente.</Empty>
        ) : (
          <ul className="space-y-2">
            {prep.openTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-body-sm text-foreground">{t.title}</span>
                <span className="shrink-0 text-caption text-card-beige-muted-foreground">
                  {t.dueAt ? formatDate(t.dueAt) : "Sem prazo"} · {PRIORITY_LABEL[t.priority] ?? t.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block icon={TrendingUp} title="Oportunidades em aberto">
        {prep.openOpportunities.length === 0 ? (
          <Empty>Nenhuma oportunidade em aberto para este cliente.</Empty>
        ) : (
          <ul className="space-y-2">
            {prep.openOpportunities.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2">
                <Button
                  variant="link"
                  className="h-auto min-w-0 truncate p-0 text-body-sm"
                  nativeButton={false}
                  render={<Link href={`/oportunidades/${o.id}`} />}
                >
                  {o.title}
                </Button>
                <span className="shrink-0 text-caption text-card-beige-muted-foreground">
                  {o.stageName ?? "—"} · {o.estimatedValue ? formatCurrencyBRL(o.estimatedValue) : "Sem valor"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block icon={Target} title="Metas ativas">
        {prep.goals.length === 0 ? (
          <Empty>Nenhuma meta ativa cadastrada.</Empty>
        ) : (
          <ul className="space-y-2">
            {prep.goals.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-body-sm text-foreground">{g.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-caption text-card-beige-muted-foreground">
                  {g.progressPct.toFixed(0)}%
                  {g.atRisk ? (
                    <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      Em risco
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block icon={FileText} title="Documentos pendentes">
        {prep.pendingDocuments.length === 0 ? (
          <Empty>Nenhum documento pendente ou vencendo.</Empty>
        ) : (
          <ul className="space-y-2">
            {prep.pendingDocuments.map((d) => (
              <li key={d.id}>
                <p className="text-body-sm font-semibold text-foreground">{d.title}</p>
                <p className="text-caption text-card-beige-muted-foreground">{d.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block icon={MessageSquare} title="Notas recentes">
        {prep.recentNotes.length === 0 ? (
          <Empty>Nenhuma nota registrada.</Empty>
        ) : (
          <ul className="space-y-2">
            {prep.recentNotes.map((n) => (
              <li key={n.id}>
                <p className="text-body-sm font-semibold text-foreground">{n.title ?? "Nota"}</p>
                <p className="line-clamp-2 text-caption text-card-beige-muted-foreground">{n.content}</p>
                <p className="text-caption text-card-beige-muted-foreground">{formatDate(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );
}
