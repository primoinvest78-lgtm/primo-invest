import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Cable,
  CreditCard,
  FileBarChart,
  FileText,
  FolderKanban,
  History,
  Gauge,
  Landmark,
  LayoutDashboard,
  MessageSquareText,
  PiggyBank,
  Radar,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
};

export type SidebarGroup = {
  title?: string;
  items: SidebarItem[];
};

export type KpiCardData = {
  title: string;
  value: string;
  change: string;
  delta: number;
  icon: LucideIcon;
};

export type WealthPoint = {
  month: string;
  value: number;
};

export type AllocationItem = {
  name: string;
  value: number;
};

export type AttentionItem = {
  description: string;
  priority: "Alta" | "Média" | "Baixa";
  quantity: number;
  icon: LucideIcon;
};

export type RelationshipSummaryData = {
  label: string;
  value: string;
};

export type PipelineStage = {
  name: string;
  value: string;
};

export type GoalItem = {
  label: string;
  value: string;
  target: string;
  progress: number;
};

export type RecentActivityItem = {
  title: string;
  time: string;
};

export const navigationGroups: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      { label: "Hub CRM", icon: Radar, href: "/crm" },
      { label: "Clientes", icon: Users, href: "/clientes" },
      { label: "Leads", icon: MessageSquareText, href: "/leads" },
      { label: "Oportunidades", icon: TrendingUp, href: "/oportunidades" },
      { label: "Tarefas", icon: FolderKanban, href: "/tarefas" },
    ],
  },
  {
    title: "Patrimônio",
    items: [
      { label: "Visão geral", icon: Gauge, href: "/patrimonio" },
      { label: "Investimentos", icon: BriefcaseBusiness, href: "/patrimonio/investimentos" },
      { label: "Contas", icon: Landmark, href: "/patrimonio/contas" },
      { label: "Passivos", icon: CreditCard, href: "/patrimonio/passivos" },
      { label: "Metas", icon: PiggyBank, href: "/patrimonio/metas" },
    ],
  },
  {
    title: "Consórcios",
    items: [
      { label: "Contratos", icon: Building2, href: "/consorcios/contratos" },
      { label: "Parcelas", icon: Wallet, href: "/consorcios/parcelas" },
      { label: "Lances", icon: ArrowUpRight, href: "/consorcios/lances" },
    ],
  },
  { items: [{ label: "Pagamentos", icon: Receipt, href: "/pagamentos" }] },
  {
    title: "Documentos",
    items: [
      { label: "Cofre digital", icon: ShieldCheck, href: "/documentos/cofre" },
      { label: "Documentos", icon: FileText, href: "/documentos/documentos" },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { label: "Report Center", icon: FileBarChart, href: "/relatorios" },
      { label: "Relatórios gerados", icon: History, href: "/relatorios/historico" },
    ],
  },
  {
    title: "Integrações",
    items: [
      { label: "Centro de Integrações", icon: Cable, href: "/integracoes" },
      { label: "Histórico de sincronização", icon: History, href: "/integracoes/historico" },
    ],
  },
  { items: [{ label: "Inteligência", icon: TrendingUp, href: "/inteligencia" }] },
  { items: [{ label: "Administração", icon: FolderKanban, href: "/administracao" }] },
];
