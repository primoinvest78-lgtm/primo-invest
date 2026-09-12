import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Landmark,
  LayoutDashboard,
  MessageSquareText,
  PiggyBank,
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
  {
    title: "Documentos",
    items: [
      { label: "Cofre digital", icon: ShieldCheck, href: "/documentos/cofre" },
      { label: "Documentos", icon: FileText, href: "/documentos/documentos" },
    ],
  },
  { items: [{ label: "Relatórios", icon: CircleDollarSign, href: "/relatorios" }] },
  { items: [{ label: "Integrações", icon: ChevronRight, href: "/integracoes" }] },
  { items: [{ label: "Inteligência", icon: TrendingUp, href: "/inteligencia" }] },
  { items: [{ label: "Administração", icon: FolderKanban, href: "/administracao" }] },
];

export const kpis: KpiCardData[] = [
  {
    title: "Patrimônio total",
    value: "R$ 48.750.320",
    change: "+8,42%",
    delta: 8.42,
    icon: Landmark,
  },
  {
    title: "Investimentos sob gestão",
    value: "R$ 41.280.000",
    change: "+6,18%",
    delta: 6.18,
    icon: BriefcaseBusiness,
  },
  {
    title: "Clientes",
    value: "184",
    change: "+12 novos",
    delta: 12,
    icon: Users,
  },
  {
    title: "Oportunidades",
    value: "R$ 7.450.000",
    change: "+14,7%",
    delta: 14.7,
    icon: TrendingUp,
  },
];

export const wealthTrend: WealthPoint[] = [
  { month: "Outubro", value: 26800000 },
  { month: "Novembro", value: 28400000 },
  { month: "Dezembro", value: 30100000 },
  { month: "Janeiro", value: 31800000 },
  { month: "Fevereiro", value: 33200000 },
  { month: "Março", value: 34700000 },
  { month: "Abril", value: 36000000 },
  { month: "Maio", value: 38150000 },
  { month: "Junho", value: 39800000 },
  { month: "Julho", value: 41850000 },
  { month: "Agosto", value: 43400000 },
  { month: "Setembro", value: 48750320 },
];

export const allocationData: AllocationItem[] = [
  { name: "Renda fixa", value: 42 },
  { name: "Fundos", value: 23 },
  { name: "Ações", value: 15 },
  { name: "Previdência", value: 8 },
  { name: "Alternativos", value: 7 },
  { name: "Caixa", value: 5 },
];

export const attentionItems: AttentionItem[] = [
  {
    description: "4 clientes aguardando retorno",
    priority: "Alta",
    quantity: 4,
    icon: Users,
  },
  {
    description: "2 propostas próximas do vencimento",
    priority: "Alta",
    quantity: 2,
    icon: FileText,
  },
  {
    description: "3 documentos aguardando assinatura",
    priority: "Média",
    quantity: 3,
    icon: ShieldCheck,
  },
  {
    description: "1 oportunidade sem movimentação",
    priority: "Média",
    quantity: 1,
    icon: TrendingUp,
  },
  {
    description: "2 tarefas em atraso",
    priority: "Baixa",
    quantity: 2,
    icon: FolderKanban,
  },
];

export const relationshipSummary: RelationshipSummaryData[] = [
  { label: "Clientes ativos", value: "184" },
  { label: "Leads em qualificação", value: "32" },
  { label: "Oportunidades abertas", value: "18" },
  { label: "Reuniões hoje", value: "7" },
];

export const pipelineStages: PipelineStage[] = [
  { name: "Novo lead", value: "R$ 1,2 mi" },
  { name: "Qualificação", value: "R$ 1,8 mi" },
  { name: "Contato", value: "R$ 2,4 mi" },
  { name: "Reunião", value: "R$ 3,1 mi" },
  { name: "Proposta", value: "R$ 4,6 mi" },
  { name: "Negociação", value: "R$ 5,3 mi" },
  { name: "Fechamento", value: "R$ 6,7 mi" },
];

export const goals: GoalItem[] = [
  {
    label: "Reserva de longo prazo",
    value: "R$ 2,4 mi",
    target: "R$ 3 mi",
    progress: 80,
  },
  {
    label: "Aposentadoria",
    value: "R$ 4,8 mi",
    target: "R$ 6 mi",
    progress: 80,
  },
  {
    label: "Expansão patrimonial",
    value: "R$ 7,2 mi",
    target: "R$ 10 mi",
    progress: 72,
  },
];

export const recentActivities: RecentActivityItem[] = [
  { title: "Nova oportunidade criada", time: "há 14 min" },
  { title: "Documento enviado para assinatura", time: "há 42 min" },
  { title: "Cliente atualizado", time: "há 1h" },
  { title: "Nova reunião agendada", time: "há 2h" },
  { title: "Movimentação registrada", time: "há 5h" },
];
