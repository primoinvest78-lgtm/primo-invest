"use client";

import { Landmark } from "lucide-react";
import { motion } from "motion/react";

import type { AccountDetail } from "@/lib/data/wealth";
import { groupAccountsByInstitution } from "@/lib/utils/account-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

function InstitutionBar({
  institutionName,
  balance,
  max,
  delay,
}: {
  institutionName: string;
  balance: number;
  max: number;
  delay: number;
}) {
  const pct = max > 0 ? Math.min((balance / max) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{institutionName}</span>
        <span className="font-bold text-foreground">{formatCurrencyBRL(balance)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </div>
  );
}

export function AccountsInstitutionSection({ accounts }: { accounts: AccountDetail[] }) {
  const institutions = groupAccountsByInstitution(accounts);
  const max = Math.max(...institutions.map((i) => i.balance), 1);

  if (institutions.length === 0) return null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-h2 font-bold text-foreground">Por instituição</h3>
      <p className="mb-5 text-sm text-card-beige-muted-foreground">
        Onde o patrimônio dos clientes está custodiado. Contas de outras instituições, corretoras,
        previdência ou ativos externos aparecem aqui automaticamente quando cadastradas.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {institutions.map((inst) => (
            <motion.div
              key={inst.institutionName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-black/10 bg-black/5 p-4 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Landmark className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{inst.institutionName}</p>
                  <p className="text-xs font-medium uppercase text-card-beige-muted-foreground">
                    {inst.accountCount} {inst.accountCount === 1 ? "conta" : "contas"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                    Saldo
                  </p>
                  <p className="font-semibold text-foreground">{formatCurrencyBRL(inst.balance)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                    Investido
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatCurrencyBRL(inst.investedBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
                    Liquidez
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatCurrencyBRL(inst.liquidBalance)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {institutions.length >= 2 ? (
          <div className="space-y-4 self-center">
            {institutions.map((inst, index) => (
              <InstitutionBar
                key={inst.institutionName}
                institutionName={inst.institutionName}
                balance={inst.balance}
                max={max}
                delay={index * 0.08}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
