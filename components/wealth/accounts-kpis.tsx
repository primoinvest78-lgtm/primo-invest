"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { AccountDetail } from "@/lib/data/wealth";
import { computeAccountBalances, computeAccountsNeedingAttention, groupAccountsByInstitution } from "@/lib/utils/account-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
  index,
  onClick,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
  index: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={[
        "card-premium rounded-2xl p-4 text-left transition-all duration-200",
        onClick ? "cursor-pointer hover:border-primary/60 hover:shadow-card" : "",
      ].join(" ")}
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.button>
  );
}

export function AccountsKpis({
  accounts,
  onSelectAttention,
}: {
  accounts: AccountDetail[];
  /** Clicar em "Contas com atenção" filtra a tabela abaixo pro mesmo recorte. */
  onSelectAttention?: () => void;
}) {
  let totalBalance = 0;
  let liquidTotal = 0;
  let investedTotal = 0;

  for (const account of accounts) {
    const { balance, liquidBalance, investedBalance } = computeAccountBalances(account);
    totalBalance += balance;
    liquidTotal += liquidBalance;
    investedTotal += investedBalance;
  }

  const institutions = groupAccountsByInstitution(accounts);
  const alertsCount = computeAccountsNeedingAttention(accounts).size;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Patrimônio em contas" value={formatCurrencyBRL(totalBalance)} index={0} />
      <Kpi label="Liquidez" value={formatCurrencyBRL(liquidTotal)} index={1} />
      <Kpi label="Total investido" value={formatCurrencyBRL(investedTotal)} index={2} />
      <Kpi label="Contas" value={String(accounts.length)} index={3} />
      <Kpi label="Instituições" value={String(institutions.length)} index={4} />
      <Kpi
        label="Contas com atenção"
        value={String(alertsCount)}
        valueClassName={alertsCount > 0 ? "text-destructive" : "text-primary"}
        animate={false}
        index={5}
        onClick={onSelectAttention}
      />
    </div>
  );
}
