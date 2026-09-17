"use client";

import {
  Banknote,
  Building2,
  Calendar,
  CircuitBoard,
  Cloud,
  FileSignature,
  LineChart,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { IntegrationRow } from "@/lib/data/integrations";
import {
  INTEGRATION_CATEGORY_LABEL,
  type IntegrationCategory,
  integrationStatusLabel,
} from "@/lib/integrations/catalog";
import { formatDateTime } from "@/lib/utils/format";

/**
 * Ícone por categoria — decidido aqui, no componente de cliente, nunca
 * vindo do servidor: um componente Lucide atravessando a fronteira
 * servidor→cliente como prop derruba a renderização inteira (função
 * não é serializável — já foi causa raiz de um incidente no
 * Dashboard).
 */
const CATEGORY_ICON: Record<IntegrationCategory, LucideIcon> = {
  open_finance: Share2,
  b3: LineChart,
  custodia: Building2,
  banco: Banknote,
  corretora: TrendingUp,
  crm: Users,
  email: Mail,
  calendario: Calendar,
  whatsapp: MessageCircle,
  assinatura_digital: FileSignature,
  armazenamento: Cloud,
  api_externa: CircuitBoard,
  servico_mercado: LineChart,
  webhook: Webhook,
};

const STATUS_DOT_CLASS: Record<string, string> = {
  not_configured: "bg-muted-foreground/40",
  active: "bg-primary",
  inactive: "bg-warning",
  error: "bg-destructive",
  revoked: "bg-destructive",
};

export function CatalogGrid({ integrations }: { integrations: IntegrationRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {integrations.map((integration, index) => {
        const Icon = CATEGORY_ICON[integration.category as IntegrationCategory] ?? LinkIcon;

        return (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: "easeOut" }}
            whileHover={{ y: -3 }}
            className="card-premium flex flex-col rounded-2xl transition-all duration-200"
          >
            <Link href={`/integracoes/${integration.id}`} className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                  <span
                    className={["h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASS[integration.status] ?? "bg-muted-foreground/40"].join(" ")}
                  />
                  {integrationStatusLabel(integration.status)}
                </span>
              </div>

              <p className="mt-3 text-label font-bold uppercase text-primary">
                {INTEGRATION_CATEGORY_LABEL[integration.category as IntegrationCategory] ?? integration.category}
              </p>
              <h3 className="mt-1 text-h2 font-bold text-foreground">{integration.name}</h3>
              <p className="mt-1 text-body-sm text-card-beige-muted-foreground">{integration.description}</p>

              {!integration.available ? (
                <p className="mt-3 text-caption font-semibold text-card-beige-muted-foreground">
                  Disponível para configuração futura
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-caption text-card-beige-muted-foreground">Registros sincronizados</p>
                  <p className="mt-0.5 text-body-sm font-bold text-foreground">
                    <AnimatedNumber value={String(integration.recordsSyncedTotal)} />
                  </p>
                </div>
                <div>
                  <p className="text-caption text-card-beige-muted-foreground">Última sincronização</p>
                  <p className="mt-0.5 truncate text-body-sm font-bold text-foreground">
                    {integration.lastSyncedAt ? formatDateTime(integration.lastSyncedAt) : "—"}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
