import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Cable,
  Calculator,
  CreditCard,
  Dices,
  FileBarChart,
  FileText,
  FolderKanban,
  History,
  Gauge,
  Landmark,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  PiggyBank,
  Radar,
  Receipt,
  ScrollText,
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
      // Acesso rápido ao treinamento da roleta (fase de apresentação aos sócios).
      { label: "Treinamento · Roleta", icon: Dices, href: "/consorcios/motor/treinamento", badge: "Teste" },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      { label: "Painel de Relacionamento", icon: Radar, href: "/crm" },
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
      { label: "Motor de apuração", icon: Calculator, href: "/consorcios/motor" },
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
      { label: "Central de Relatórios", icon: FileBarChart, href: "/relatorios" },
      { label: "Relatórios gerados", icon: History, href: "/relatorios/historico" },
    ],
  },
  {
    title: "Integrações",
    items: [
      { label: "Integrações", icon: Cable, href: "/integracoes" },
      { label: "Histórico de sincronização", icon: History, href: "/integracoes/historico" },
    ],
  },
  { items: [{ label: "Inteligência", icon: TrendingUp, href: "/inteligencia" }] },
  { items: [{ label: "Administração", icon: FolderKanban, href: "/administracao" }] },
  {
    title: "Ajuda e documentos",
    items: [
      { label: "Manual de uso", icon: BookOpen, href: "/ajuda" },
      { label: "Política de Privacidade", icon: Lock, href: "/privacidade" },
      { label: "Termos de Uso", icon: ScrollText, href: "/termos" },
    ],
  },
];
