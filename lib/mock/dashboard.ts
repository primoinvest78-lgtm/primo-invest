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
  active?: boolean;
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
  accent: string;
};

export type WealthPoint = {
  month: string;
  value: number;
};

export type AllocationItem = {
  name: string;
  value: number;
  color: string;
};

export type AttentionItem = {
  description: string;
  priority: "Alta" | "Média" | "Baixa";
  quantity: number;
  icon: LucideIcon;
  tone: string;
};

export type RelationshipSummaryData = {
  label: string;
  value: string;
};

export type PipelineStage = {
  name: string;
  value: string;
  tone: string;
};

export type GoalItem = {
  label: string;
  value: string;
  target: string;
  progress: number;
  tone: string;
};

export type RecentActivityItem = {
  title: string;
  time: string;
  tone: string;
};

export const navigationGroups: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
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
    accent: "bg-[#123E68]/10 text-[#123E68]",
  },
  {
    title: "Investimentos sob gestão",
    value: "R$ 41.280.000",
    change: "+6,18%",
    delta: 6.18,
    icon: BriefcaseBusiness,
    accent: "bg-[#1F5F96]/10 text-[#1F5F96]",
  },
  {
    title: "Clientes",
    value: "184",
    change: "+12 novos",
    delta: 12,
    icon: Users,
    accent: "bg-[#C9A45C]/12 text-[#C9A45C]",
  },
  {
    title: "Oportunidades",
    value: "R$ 7.450.000",
    change: "+14,7%",
    delta: 14.7,
    icon: TrendingUp,
    accent: "bg-[#18794E]/10 text-[#18794E]",
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
  { name: "Renda fixa", value: 42, color: "#123E68" },
  { name: "Fundos", value: 23, color: "#1F5F96" },
  { name: "Ações", value: 15, color: "#C9A45C" },
  { name: "Previdência", value: 8, color: "#E3C982" },
  { name: "Alternativos", value: 7, color: "#64748B" },
  { name: "Caixa", value: 5, color: "#18794E" },
];

export const attentionItems: AttentionItem[] = [
  {
    description: "4 clientes aguardando retorno",
    priority: "Alta",
    quantity: 4,
    icon: Users,
    tone: "bg-[#123E68]/10 text-[#123E68]",
  },
  {
    description: "2 propostas próximas do vencimento",
    priority: "Alta",
    quantity: 2,
    icon: FileText,
    tone: "bg-[#C9A45C]/15 text-[#C9A45C]",
  },
  {
    description: "3 documentos aguardando assinatura",
    priority: "Média",
    quantity: 3,
    icon: ShieldCheck,
    tone: "bg-[#1F5F96]/10 text-[#1F5F96]",
  },
  {
    description: "1 oportunidade sem movimentação",
    priority: "Média",
    quantity: 1,
    icon: TrendingUp,
    tone: "bg-[#64748B]/10 text-[#64748B]",
  },
  {
    description: "2 tarefas em atraso",
    priority: "Baixa",
    quantity: 2,
    icon: FolderKanban,
    tone: "bg-[#18794E]/10 text-[#18794E]",
  },
];

export const relationshipSummary: RelationshipSummaryData[] = [
  { label: "Clientes ativos", value: "184" },
  { label: "Leads em qualificação", value: "32" },
  { label: "Oportunidades abertas", value: "18" },
  { label: "Reuniões hoje", value: "7" },
];

export const pipelineStages: PipelineStage[] = [
  { name: "Novo lead", value: "R$ 1,2 mi", tone: "bg-[#123E68]" },
  { name: "Qualificação", value: "R$ 1,8 mi", tone: "bg-[#1F5F96]" },
  { name: "Contato", value: "R$ 2,4 mi", tone: "bg-[#C9A45C]" },
  { name: "Reunião", value: "R$ 3,1 mi", tone: "bg-[#E3C982]" },
  { name: "Proposta", value: "R$ 4,6 mi", tone: "bg-[#64748B]" },
  { name: "Negociação", value: "R$ 5,3 mi", tone: "bg-[#18794E]" },
  { name: "Fechamento", value: "R$ 6,7 mi", tone: "bg-[#071A2D]" },
];

export const goals: GoalItem[] = [
  {
    label: "Reserva de longo prazo",
    value: "R$ 2,4 mi",
    target: "R$ 3 mi",
    progress: 80,
    tone: "#123E68",
  },
  {
    label: "Aposentadoria",
    value: "R$ 4,8 mi",
    target: "R$ 6 mi",
    progress: 80,
    tone: "#1F5F96",
  },
  {
    label: "Expansão patrimonial",
    value: "R$ 7,2 mi",
    target: "R$ 10 mi",
    progress: 72,
    tone: "#C9A45C",
  },
];

export const recentActivities: RecentActivityItem[] = [
  { title: "Nova oportunidade criada", time: "há 14 min", tone: "bg-[#123E68]" },
  { title: "Documento enviado para assinatura", time: "há 42 min", tone: "bg-[#1F5F96]" },
  { title: "Cliente atualizado", time: "há 1h", tone: "bg-[#C9A45C]" },
  { title: "Nova reunião agendada", time: "há 2h", tone: "bg-[#18794E]" },
  { title: "Movimentação registrada", time: "há 5h", tone: "bg-[#64748B]" },
];
