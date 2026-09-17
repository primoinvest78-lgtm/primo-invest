"use client";

import {
  Briefcase,
  Check,
  Cog,
  FileText,
  Landmark,
  Loader2,
  RotateCcw,
  Target,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateTaskFromInsightDialog } from "@/components/intelligence/create-task-from-insight-dialog";
import { ignoreInsight, reopenInsight, resolveInsight } from "@/lib/actions/intelligence";
import {
  INSIGHT_PRIORITY_LABEL,
  INSIGHT_STATUS_LABEL,
  INSIGHT_TYPE_LABEL,
  SOURCE_MODULE_LABEL,
  type Insight,
  type InsightSourceModule,
  type InsightType,
} from "@/lib/intelligence/types";
import { formatDate } from "@/lib/utils/format";

const MODULE_ICON: Record<InsightSourceModule, typeof Users> = {
  tarefas: Check,
  leads: UserRound,
  oportunidades: Briefcase,
  clientes: Users,
  metas: Target,
  passivos: Wallet,
  consorcios: Landmark,
  documentos: FileText,
  patrimonio: Wallet,
  integracoes: Cog,
};

const TYPE_CLASS: Record<InsightType, string> = {
  atencao: "border-warning/50 bg-warning/[0.07]",
  oportunidade: "border-primary/40 bg-primary/[0.06]",
  pendencia: "border-destructive/50 bg-destructive/[0.07]",
  informacao: "border-border bg-muted/30",
};

const TYPE_BADGE_CLASS: Record<InsightType, string> = {
  atencao: "border-warning/40 bg-warning/15 text-warning",
  oportunidade: "border-primary/30 bg-primary/10 text-primary",
  pendencia: "border-destructive/40 bg-destructive/10 text-destructive",
  informacao: "border-border bg-muted text-muted-foreground",
};

const PRIORITY_CLASS: Record<Insight["priority"], string> = {
  alta: "border-destructive/40 bg-destructive/10 text-destructive",
  media: "border-warning/40 bg-warning/15 text-warning",
  baixa: "border-border bg-muted text-muted-foreground",
};

const TYPE_FILTERS: { key: "all" | InsightType; label: string }[] = [
  { key: "all", label: "Tudo" },
  { key: "atencao", label: "Atenção" },
  { key: "oportunidade", label: "Oportunidade" },
  { key: "pendencia", label: "Pendência" },
  { key: "informacao", label: "Informação" },
];

const PAGE_SIZE = 20;

function InsightActions({ insight }: { insight: Insight }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(action: "resolved" | "ignored" | "reopened") {
    startTransition(async () => {
      const fn = action === "resolved" ? resolveInsight : action === "ignored" ? ignoreInsight : reopenInsight;
      await fn(insight);
      router.refresh();
    });
  }

  const clientHref = insight.clientId ? `/clientes/${insight.clientId}` : null;
  const originIsClientPage = clientHref !== null && insight.sourceHref === clientHref;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {clientHref ? (
        <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={clientHref} />}>
          Ver cliente
        </Button>
      ) : null}
      {originIsClientPage ? null : (
        <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={insight.sourceHref} />}>
          {insight.sourceModule === "oportunidades" ? "Abrir oportunidade" : "Ver origem"}
        </Button>
      )}

      {insight.status === "aberto" ? (
        <>
          <CreateTaskFromInsightDialog insight={insight} />
          <Button size="sm" variant="outline" disabled={pending} onClick={() => act("ignored")}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Ignorar
          </Button>
          <Button size="sm" disabled={pending} onClick={() => act("resolved")}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Marcar como resolvido
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => act("reopened")}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Reabrir
        </Button>
      )}
    </div>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const Icon = MODULE_ICON[insight.sourceModule];

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.02, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={["rounded-2xl border p-4 transition-all duration-200", TYPE_CLASS[insight.type]].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card-beige text-card-beige-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground">{insight.title}</p>
              <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", TYPE_BADGE_CLASS[insight.type]].join(" ")}>
                {INSIGHT_TYPE_LABEL[insight.type]}
              </span>
              <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", PRIORITY_CLASS[insight.priority]].join(" ")}>
                {INSIGHT_PRIORITY_LABEL[insight.priority]}
              </span>
              {insight.status !== "aberto" ? (
                <Badge variant="secondary">{INSIGHT_STATUS_LABEL[insight.status]}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-body-sm text-card-beige-muted-foreground">{insight.reason}</p>
            <p className="mt-1 text-caption text-card-beige-muted-foreground">
              {SOURCE_MODULE_LABEL[insight.sourceModule]}
              {insight.clientName ? ` · ${insight.clientName}` : ""} · {formatDate(insight.date)} · regra
              determinística
            </p>
            {insight.dataUsed.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {insight.dataUsed.map((d) => (
                  <span key={d.label} className="text-caption text-card-beige-muted-foreground">
                    <span className="font-semibold text-foreground">{d.label}:</span> {d.value}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-caption font-semibold text-foreground">Próxima ação sugerida: {insight.suggestedAction}</p>
          </div>
        </div>

        <InsightActions insight={insight} />
      </div>
    </motion.li>
  );
}

export function InsightFeed({ insights }: { insights: Insight[] }) {
  const [typeFilter, setTypeFilter] = useState<"all" | InsightType>("all");
  const [showResolved, setShowResolved] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return insights.filter((i) => {
      if (!showResolved && i.status !== "aberto") return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      return true;
    });
  }, [insights, typeFilter, showResolved]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Insights</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Central de Inteligência</h3>
        </div>
        <span className="shrink-0 text-body-sm text-card-beige-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "insight" : "insights"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={typeFilter === f.key ? "default" : "outline"}
              onClick={() => {
                setTypeFilter(f.key);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setShowResolved((v) => !v);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          {showResolved ? "Mostrar só em aberto" : "Mostrar resolvidos/ignorados"}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <Check className="h-6 w-6 text-primary" />
          <p className="text-body-sm font-semibold text-foreground">Nenhum insight por aqui.</p>
          <p className="text-caption text-card-beige-muted-foreground">
            {showResolved ? "Nada nessa categoria." : "Nada em aberto nessa categoria agora."}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {visible.map((insight, index) => (
              <InsightCard key={insight.key} insight={insight} index={index} />
            ))}
          </ul>
          {filtered.length > visible.length ? (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                Carregar mais
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
